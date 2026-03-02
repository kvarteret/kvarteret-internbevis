import {
    Timestamp,
    collection,
    doc,
    getDocFromServer,
    getDocsFromServer,
    limit,
    orderBy,
    query,
    where,
} from "firebase/firestore"
import { db } from "@/core/api/firebase"
import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import { pickHomeEvents, selectEventTranslation } from "@/features/dashboard/domain/eventSelection"
import { FirestoreEventDocument } from "@/features/dashboard/domain/types"

const HOME_EVENTS_QUERY_LIMIT = 30
const EVENTS_CACHE_KEY = "firestore_cache:events:home"
const EVENT_CACHE_KEY_PREFIX = "firestore_cache:event"
const FIRESTORE_TEXT_CACHE_TTL_MS = 15 * 60 * 1000

interface CachedFirestoreEventDocument
    extends Omit<
        FirestoreEventDocument,
        "event_start" | "event_end" | "created_at" | "updated_at"
    > {
    event_start: number
    event_end: number
    created_at: number
    updated_at: number
}

interface CachedPayload<T> {
    cachedAt: number
    value: T
}

const mapEventDocument = (id: string, data: Record<string, unknown>): FirestoreEventDocument => {
    return {
        id,
        ...(data as Omit<FirestoreEventDocument, "id">),
    }
}

const serializeEvent = (event: FirestoreEventDocument): CachedFirestoreEventDocument => ({
    ...event,
    event_start: event.event_start.toMillis(),
    event_end: event.event_end.toMillis(),
    created_at: event.created_at.toMillis(),
    updated_at: event.updated_at.toMillis(),
})

const deserializeEvent = (event: CachedFirestoreEventDocument): FirestoreEventDocument => ({
    ...event,
    event_start: Timestamp.fromMillis(event.event_start),
    event_end: Timestamp.fromMillis(event.event_end),
    created_at: Timestamp.fromMillis(event.created_at),
    updated_at: Timestamp.fromMillis(event.updated_at),
})

const getEventCacheKey = (eventId: string): string => `${EVENT_CACHE_KEY_PREFIX}:${eventId}`

const readCachedValue = async <T, U>(
    key: string,
    maxAgeMs: number,
    deserialize: (value: T) => U,
): Promise<U | null> => {
    try {
        const payload = await getStoredJson<CachedPayload<T>>(key)
        if (!payload) {
            return null
        }

        const ageMs = Date.now() - payload.cachedAt
        if (ageMs > maxAgeMs) {
            return null
        }

        return deserialize(payload.value)
    } catch {
        return null
    }
}

const writeCachedValue = async <T>(key: string, value: T): Promise<void> => {
    try {
        await setStoredJson(key, {
            cachedAt: Date.now(),
            value,
        })
    } catch {
        // Ignore cache write failures and keep network responses authoritative.
    }
}

export const fetchHomeEvents = async (_signal?: AbortSignal): Promise<FirestoreEventDocument[]> => {
    const eventsQuery = query(
        collection(db, "events"),
        where("status", "==", "published"),
        orderBy("event_start", "asc"),
        limit(HOME_EVENTS_QUERY_LIMIT),
    )

    try {
        const snapshot = await getDocsFromServer(eventsQuery)
        const events = snapshot.docs.map(docSnapshot =>
            mapEventDocument(docSnapshot.id, docSnapshot.data() as Record<string, unknown>),
        )
        const pickedEvents = pickHomeEvents(events, { maxCount: HOME_EVENTS_QUERY_LIMIT })

        await writeCachedValue(
            EVENTS_CACHE_KEY,
            pickedEvents.map(serializeEvent),
        )

        return pickedEvents
    } catch (error) {
        const cachedEvents = await readCachedValue<CachedFirestoreEventDocument[], FirestoreEventDocument[]>(
            EVENTS_CACHE_KEY,
            FIRESTORE_TEXT_CACHE_TTL_MS,
            value => value.map(deserializeEvent),
        )

        if (cachedEvents) {
            return cachedEvents
        }

        throw error
    }
}

export const fetchEventById = async (
    eventId: string,
    _signal?: AbortSignal,
): Promise<FirestoreEventDocument> => {
    const eventRef = doc(db, "events", eventId)
    const cacheKey = getEventCacheKey(eventId)

    try {
        const snapshot = await getDocFromServer(eventRef)

        if (!snapshot.exists()) {
            throw new Error("Event not found.")
        }

        const event = mapEventDocument(snapshot.id, snapshot.data() as Record<string, unknown>)
        await writeCachedValue(cacheKey, serializeEvent(event))
        return event
    } catch (error) {
        const cachedEvent = await readCachedValue<CachedFirestoreEventDocument, FirestoreEventDocument>(
            cacheKey,
            FIRESTORE_TEXT_CACHE_TTL_MS,
            deserializeEvent,
        )

        if (cachedEvent) {
            return cachedEvent
        }

        throw error
    }
}

export { pickHomeEvents, selectEventTranslation }
