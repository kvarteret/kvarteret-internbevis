jest.mock("expo-constants", () => ({
    __esModule: true,
    default: { expoConfig: { version: "2026.2.0" } },
}))
jest.mock("expo-updates", () => ({
    runtimeVersion: "2026.2.0",
    channel: "production",
    updateId: "test-update",
}))
jest.mock("posthog-react-native", () => ({ __esModule: true, default: jest.fn() }))
jest.mock("@/core/storage/asyncStorage", () => ({
    getStoredJson: jest.fn(),
    getStoredValue: jest.fn(),
    setStoredJson: jest.fn(),
    setStoredValue: jest.fn(),
}))

import { getStoredJson, getStoredValue, setStoredJson } from "@/core/storage/asyncStorage"
import { reportSessionLogoutDiagnostic } from "@/features/auth/data/authDiagnosticsRepository"
import {
    createDiagnosticSessionId,
    emitOperationalDiagnostic,
    flushOperationalDiagnostics,
} from "../index"

let queue: unknown[] = []
beforeEach(() => {
    queue = []
    ;(getStoredValue as jest.Mock).mockResolvedValue(null)
    ;(getStoredJson as jest.Mock).mockImplementation(async () => queue)
    ;(setStoredJson as jest.Mock).mockImplementation(async (_key, value) => {
        queue = value
    })
    global.fetch = jest.fn().mockResolvedValue({ status: 202 })
})

it("connects forced logout to its authorization session without private values", async () => {
    await reportSessionLogoutDiagnostic({
        authErrorCode: "INVALID_AUTH",
        authErrorStatus: 401,
        authErrorMessage: "secret",
        cachedUserId: 42,
        eventName: "session_invalidated",
        hadCachedUser: true,
        hadLoginMarker: true,
        hadStoredCredentials: true,
        occurredAt: new Date().toISOString(),
    })
    await flushOperationalDiagnostics()
    const [url, request] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toContain("/api/v1/mobile-card/client-events/diagnostics")
    expect(request.headers["X-Session-ID"]).toBe(createDiagnosticSessionId())
    const body = JSON.parse(request.body)
    expect(body.event_name).toBe("session_invalidated")
    expect(body.auth_error_status).toBe(401)
    expect(body.had_stored_credentials).toBe(true)
    expect(body.session_id).toBeUndefined()
    expect(request.body).not.toContain("secret")
    expect(body.cached_user_id).toBeUndefined()
})

it.each([
    "logout_succeeded",
    "logout_failed",
] as const)("delivers %s without authentication", async event => {
    await emitOperationalDiagnostic(event)
    await flushOperationalDiagnostics()
    const request = (global.fetch as jest.Mock).mock.calls[0][1]
    expect(JSON.parse(request.body).event_name).toBe(event)
    expect(request.headers.Authorization).toBeUndefined()
})

it("queues failed delivery with backoff and preserves the original session", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({ status: 503 })
    await emitOperationalDiagnostic("session_invalidated", { authErrorStatus: 401 })
    await flushOperationalDiagnostics()
    expect(queue).toHaveLength(1)
    expect(queue[0]).toMatchObject({
        session_id: createDiagnosticSessionId(),
        event_name: "session_invalidated",
    })
})
