export type SessionLogoutDiagnosticEventName =
    | "credentials_missing_after_login"
    | "session_invalidated"

export interface SessionLogoutDiagnosticInput {
    authErrorCode: string | null
    authErrorMessage: string | null
    authErrorStatus: number | null
    cachedUserId: number | null
    eventName: SessionLogoutDiagnosticEventName
    hadCachedUser: boolean
    hadLoginMarker: boolean
    hadStoredCredentials: boolean
    occurredAt: string
}

export interface SessionRuntimeMetadata {
    appVersion: string | null
    executionEnvironment: string | null
    platform: string
    runtimeVersion: string | null
    updateChannel: string | null
    updateId: string | null
}

export interface SessionLogoutDiagnosticPayload {
    app_version: string | null
    auth_error_code: string | null
    auth_error_message: string | null
    auth_error_status: number | null
    cached_user_id: number | null
    event_name: SessionLogoutDiagnosticEventName
    execution_environment: string | null
    had_cached_user: boolean
    had_login_marker: boolean
    had_stored_credentials: boolean
    occurred_at: string
    platform: string
    runtime_version: string | null
    update_channel: string | null
    update_id: string | null
}

export const buildSessionLogoutDiagnosticPayload = (
    input: SessionLogoutDiagnosticInput,
    runtimeMetadata: SessionRuntimeMetadata,
): SessionLogoutDiagnosticPayload => ({
    app_version: runtimeMetadata.appVersion,
    auth_error_code: input.authErrorCode,
    auth_error_message: input.authErrorMessage,
    auth_error_status: input.authErrorStatus,
    cached_user_id: input.cachedUserId,
    event_name: input.eventName,
    execution_environment: runtimeMetadata.executionEnvironment,
    had_cached_user: input.hadCachedUser,
    had_login_marker: input.hadLoginMarker,
    had_stored_credentials: input.hadStoredCredentials,
    occurred_at: input.occurredAt,
    platform: runtimeMetadata.platform,
    runtime_version: runtimeMetadata.runtimeVersion,
    update_channel: runtimeMetadata.updateChannel,
    update_id: runtimeMetadata.updateId,
})
