import { buildSessionLogoutDiagnosticPayload } from "@/features/auth/domain/authDiagnostics"

describe("buildSessionLogoutDiagnosticPayload", () => {
    it("builds a payload for session invalidation events", () => {
        expect(
            buildSessionLogoutDiagnosticPayload(
                {
                    authErrorCode: "INVALID_AUTH",
                    authErrorMessage: "Session expired. Please sign in again.",
                    authErrorStatus: 401,
                    cachedUserId: 12,
                    eventName: "session_invalidated",
                    hadCachedUser: true,
                    hadLoginMarker: true,
                    hadStoredCredentials: true,
                    occurredAt: "2026-03-28T10:15:00.000Z",
                },
                {
                    appVersion: "2026.2.0",
                    executionEnvironment: "standalone",
                    platform: "ios",
                    runtimeVersion: "2026.2.0",
                    updateChannel: "production",
                    updateId: "update-123",
                },
            ),
        ).toEqual({
            app_version: "2026.2.0",
            auth_error_code: "INVALID_AUTH",
            auth_error_message: "Session expired. Please sign in again.",
            auth_error_status: 401,
            cached_user_id: 12,
            event_name: "session_invalidated",
            execution_environment: "standalone",
            had_cached_user: true,
            had_login_marker: true,
            had_stored_credentials: true,
            occurred_at: "2026-03-28T10:15:00.000Z",
            platform: "ios",
            runtime_version: "2026.2.0",
            update_channel: "production",
            update_id: "update-123",
        })
    })

    it("supports missing-credentials events without auth error details", () => {
        expect(
            buildSessionLogoutDiagnosticPayload(
                {
                    authErrorCode: null,
                    authErrorMessage: null,
                    authErrorStatus: null,
                    cachedUserId: 99,
                    eventName: "credentials_missing_after_login",
                    hadCachedUser: false,
                    hadLoginMarker: true,
                    hadStoredCredentials: false,
                    occurredAt: "2026-03-28T10:15:00.000Z",
                },
                {
                    appVersion: null,
                    executionEnvironment: null,
                    platform: "android",
                    runtimeVersion: null,
                    updateChannel: null,
                    updateId: null,
                },
            ),
        ).toMatchObject({
            event_name: "credentials_missing_after_login",
            cached_user_id: 99,
            had_cached_user: false,
            had_login_marker: true,
            had_stored_credentials: false,
            platform: "android",
        })
    })
})
