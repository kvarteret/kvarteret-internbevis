import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore"
import { db } from "@/core/api/firebase"
import { pickHomeEvents, selectEventTranslation } from "@/features/dashboard/domain/eventSelection"
import { FirestoreEventDocument } from "@/features/dashboard/domain/types"

const HOME_EVENTS_QUERY_LIMIT = 30

const mapEventDocument = (id: string, data: Record<string, unknown>): FirestoreEventDocument => {
    return {
        id,
        ...(data as Omit<FirestoreEventDocument, "id">),
    }
}

export const fetchHomeEvents = async (_signal?: AbortSignal): Promise<FirestoreEventDocument[]> => {
    const eventsQuery = query(
        collection(db, "events"),
        where("status", "==", "published"),
        orderBy("event_start", "asc"),
        limit(HOME_EVENTS_QUERY_LIMIT),
    )

    const snapshot = await getDocs(eventsQuery)
    const events = snapshot.docs.map(docSnapshot =>
        mapEventDocument(docSnapshot.id, docSnapshot.data() as Record<string, unknown>),
    )

    return pickHomeEvents(events)
}

export const fetchEventById = async (
    eventId: string,
    _signal?: AbortSignal,
): Promise<FirestoreEventDocument> => {
    const eventRef = doc(db, "events", eventId)
    const snapshot = await getDoc(eventRef)

    if (!snapshot.exists()) {
        throw new Error("Event not found.")
    }

    return mapEventDocument(snapshot.id, snapshot.data() as Record<string, unknown>)
}

export { pickHomeEvents, selectEventTranslation }
