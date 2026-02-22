import { isInvalidAuthError, toAuthServiceError } from "@/features/auth/domain/authError"

export const shouldClearCredentialsOnHydrationError = (error: unknown): boolean =>
    isInvalidAuthError(error)

export const getHydrationErrorMessage = (error: unknown): string => toAuthServiceError(error).message
