import Constants from "expo-constants"
import * as Updates from "expo-updates"
import PostHog from "posthog-react-native"
import { Platform } from "react-native"
import { appEnv } from "@/app/config/env"
import {
    getStoredJson,
    getStoredValue,
    setStoredJson,
    setStoredValue,
} from "@/core/storage/asyncStorage"

const QUEUE_KEY = "mobile_observability_queue_v1"
const COLLECTION_PREFERENCE_KEY = "mobile_operational_diagnostics_enabled"
export const PRODUCT_ANALYTICS_PREFERENCE_KEY = "mobile_product_analytics_enabled"
const MAX_QUEUE_SIZE = 100
const MAX_QUEUE_AGE_MS = 24 * 60 * 60 * 1000
const REPORT_TIMEOUT_MS = 1_500

export type MobileDiagnosticEventName =
    | "cache_fallback_started"
    | "cache_fallback_recovered"
    | "credentials_missing_after_login"
    | "logout_failed"
    | "logout_succeeded"
    | "response_invalid"
    | "session_invalidated"
    | "session_token_persist_failed"

export type MobileProductEventName = "mobile_card.displayed"

interface MobileDiagnosticRecord {
    app_version: string | null
    auth_error_code: string | null
    auth_error_status: number | null
    event_id: string
    event_name: MobileDiagnosticEventName
    occurred_at: string
    operation_id: string
    attempt_count: number
    next_attempt_at: number
    platform: string
    runtime_version: string | null
    update_channel: string | null
    update_id: string | null
}

const normalized = (value: unknown, maxLength: number): string | null => {
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null
}

const eventId = (): string =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`

export const createClientRequestId = (): string => eventId()

let productAnalyticsClient: PostHog | null = null

const getProductAnalyticsClient = (): PostHog | null => {
    if (!appEnv.posthogApiKey) return null
    productAnalyticsClient ??= new PostHog(appEnv.posthogApiKey, {
        captureAppLifecycleEvents: false,
        defaultOptIn: false,
        host: appEnv.posthogHost,
        persistence: "file",
    })
    return productAnalyticsClient
}

export const setProductAnalyticsEnabled = async (enabled: boolean): Promise<void> => {
    await setStoredValue(PRODUCT_ANALYTICS_PREFERENCE_KEY, enabled ? "true" : "false")
    const client = getProductAnalyticsClient()
    if (client) {
        await (enabled ? client.optIn() : client.optOut())
    }
}

export const captureProductEvent = async (
    eventName: MobileProductEventName,
    properties: Record<string, string>,
): Promise<void> => {
    try {
        if ((await getStoredValue(PRODUCT_ANALYTICS_PREFERENCE_KEY)) !== "true") return
        const client = getProductAnalyticsClient()
        if (!client) return
        await client.optIn()
        client.capture(eventName, properties)
    } catch {
        // Product analytics must never affect the displayed card or navigation.
    }
}

const getDiagnosticsUrl = (): string => {
    const configured = appEnv.internkortBaseUrl.trim().replace(/\/$/, "")
    return `${configured}/client-events/diagnostics`
}

const runtimeRecord = (
    eventName: MobileDiagnosticEventName,
    input: { authErrorCode?: string | null; authErrorStatus?: number | null },
): MobileDiagnosticRecord => {
    const occurrenceId = eventId()
    return {
        app_version: normalized(Constants.expoConfig?.version, 64),
        auth_error_code: normalized(input.authErrorCode, 64),
        auth_error_status:
            typeof input.authErrorStatus === "number" &&
            input.authErrorStatus >= 400 &&
            input.authErrorStatus <= 599
                ? input.authErrorStatus
                : null,
        event_id: occurrenceId,
        event_name: eventName,
        occurred_at: new Date().toISOString(),
        operation_id: occurrenceId,
        attempt_count: 0,
        next_attempt_at: 0,
        platform: Platform.OS.slice(0, 32),
        runtime_version: normalized(Updates.runtimeVersion, 64),
        update_channel: normalized(Updates.channel, 64),
        update_id: normalized(Updates.updateId, 128),
    }
}

const readQueue = async (): Promise<MobileDiagnosticRecord[]> => {
    const value = await getStoredJson<unknown>(QUEUE_KEY)
    if (!Array.isArray(value)) return []
    return value.flatMap(item => {
        if (!item || typeof item !== "object") return []
        const candidate = item as Partial<MobileDiagnosticRecord>
        const occurredAt = Date.parse(String(candidate.occurred_at))
        if (!Number.isFinite(occurredAt) || Date.now() - occurredAt > MAX_QUEUE_AGE_MS) {
            return []
        }
        return [
            {
                ...candidate,
                attempt_count: candidate.attempt_count ?? 0,
                next_attempt_at: candidate.next_attempt_at ?? 0,
            } as MobileDiagnosticRecord,
        ]
    })
}

const isCollectionEnabled = async (): Promise<boolean> =>
    (await getStoredValue(COLLECTION_PREFERENCE_KEY)) !== "false"

const post = async (record: MobileDiagnosticRecord): Promise<boolean> => {
    const controller = typeof AbortController === "undefined" ? null : new AbortController()
    const timeoutId =
        controller === null ? null : setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS)
    try {
        const payload = { ...record } as Record<string, unknown>
        delete payload.attempt_count
        delete payload.next_attempt_at
        const attemptNo = record.attempt_count + 1
        payload.attempt_id = `${record.event_id}:${attemptNo}`
        payload.attempt_no = attemptNo
        payload.source = "client"
        const response = await fetch(getDiagnosticsUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Request-ID": createClientRequestId(),
            },
            body: JSON.stringify(payload),
            signal: controller?.signal,
        })
        return response.status === 202
    } catch {
        return false
    } finally {
        if (timeoutId !== null) clearTimeout(timeoutId)
    }
}

export const flushOperationalDiagnostics = async (): Promise<void> => {
    try {
        if (!(await isCollectionEnabled())) return
        const queue = await readQueue()
        const remaining: MobileDiagnosticRecord[] = []
        for (const record of queue) {
            if (record.next_attempt_at > Date.now()) {
                remaining.push(record)
                continue
            }
            if (!(await post(record))) {
                const attemptCount = record.attempt_count + 1
                remaining.push({
                    ...record,
                    attempt_count: attemptCount,
                    next_attempt_at:
                        Date.now() + Math.min(6 * 60 * 60 * 1000, 60_000 * 2 ** (attemptCount - 1)),
                })
            }
        }
        await setStoredJson(QUEUE_KEY, remaining.slice(-MAX_QUEUE_SIZE))
    } catch {
        // Storage and diagnostics transport are both best-effort.
    }
}

export const emitOperationalDiagnostic = async (
    eventName: MobileDiagnosticEventName,
    input: { authErrorCode?: string | null; authErrorStatus?: number | null } = {},
): Promise<void> => {
    try {
        if (!(await isCollectionEnabled())) return
        const queue = await readQueue()
        queue.push(runtimeRecord(eventName, input))
        await setStoredJson(QUEUE_KEY, queue.slice(-MAX_QUEUE_SIZE))
        void flushOperationalDiagnostics()
    } catch {
        // Diagnostics must never affect authentication or navigation.
    }
}
