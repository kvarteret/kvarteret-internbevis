import { isInvalidAuthError, isTransientAuthError } from "@/features/auth/domain/authError"
import { User } from "@/shared/types/user"

// Pure decision logic for session hydration on app launch. SessionProvider
// gathers the stored inputs and executes the returned outcome; every branch of
// the credentials/cache/marker matrix is unit-testable without React or I/O.

export interface HydrationSnapshot {
    hasStoredCredentials: boolean
    cachedUser: User | null
    hasLoginMarker: boolean
}

export type HydrationPrecheckOutcome =
    // A login marker without credentials means the SecureStore entry vanished
    // after a successful login: report a diagnostic and clear the session.
    | { kind: "inconsistent-state-clear" }
    // Credentials exist: optionally show the cached card, then refresh from /me.
    | { kind: "refresh"; cachedUser: User | null }
    // Nothing stored: resolve to anonymous or signed-out from the stored flag.
    | { kind: "signed-out" }

export const resolveHydrationPrecheck = (snapshot: HydrationSnapshot): HydrationPrecheckOutcome => {
    if (!snapshot.hasStoredCredentials && snapshot.hasLoginMarker) {
        return { kind: "inconsistent-state-clear" }
    }

    if (snapshot.hasStoredCredentials) {
        return { kind: "refresh", cachedUser: snapshot.cachedUser }
    }

    return { kind: "signed-out" }
}

export type HydrationErrorOutcome =
    // Definitive auth rejection: report a diagnostic and clear the session.
    | { kind: "clear-session" }
    // Transient failure with a cached card: keep the user logged in on it.
    | { kind: "keep-cached-user"; cachedUser: User }
    // Anything else: end up signed out, surfacing the error message.
    | { kind: "signed-out-with-error" }

export const resolveHydrationErrorOutcome = (
    error: unknown,
    cachedUser: User | null,
): HydrationErrorOutcome => {
    if (isInvalidAuthError(error)) {
        return { kind: "clear-session" }
    }

    if (isTransientAuthError(error) && cachedUser) {
        return { kind: "keep-cached-user", cachedUser }
    }

    return { kind: "signed-out-with-error" }
}
