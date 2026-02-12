import { isInvalidAuthError, toAuthServiceError } from "../services/authError"

export function shouldClearCredentialsOnHydrationError(error: unknown): boolean {
    return isInvalidAuthError(error)
}

export function getHydrationErrorMessage(error: unknown): string {
    return toAuthServiceError(error).message
}
