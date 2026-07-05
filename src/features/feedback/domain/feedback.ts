import { isEmailValid, normalizeEmail } from "@/features/auth/domain/authValidation"
import { User } from "@/shared/types/user"

export const FEEDBACK_PAGE = "/(tabs)/feedback"
export const MAX_FEEDBACK_MESSAGE_LENGTH = 2_000

export type FeedbackValidationErrorCode =
    | "CONTACT_EMAIL_INVALID"
    | "MESSAGE_REQUIRED"
    | "MESSAGE_TOO_LONG"

export class FeedbackValidationError extends Error {
    code: FeedbackValidationErrorCode

    constructor(code: FeedbackValidationErrorCode) {
        super(code)
        this.name = "FeedbackValidationError"
        this.code = code
    }
}

export interface FeedbackUserContext {
    id: number
    fullName: string | null
}

export const buildFeedbackUserContext = (user: User | null): FeedbackUserContext | null => {
    if (!user) {
        return null
    }

    const fullName = `${user.fornavn} ${user.etternavn}`.trim()

    return {
        id: user.id,
        fullName: fullName.length > 0 ? fullName : null,
    }
}

export const normalizeFeedbackMessage = (value: string): string => {
    const normalizedMessage = value.trim()

    if (!normalizedMessage) {
        throw new FeedbackValidationError("MESSAGE_REQUIRED")
    }

    if (normalizedMessage.length > MAX_FEEDBACK_MESSAGE_LENGTH) {
        throw new FeedbackValidationError("MESSAGE_TOO_LONG")
    }

    return normalizedMessage
}

export const normalizeFeedbackContactEmail = (value: string | null | undefined): string | null => {
    if (!value) {
        return null
    }

    const normalizedEmail = normalizeEmail(value)
    if (!normalizedEmail) {
        return null
    }

    if (!isEmailValid(normalizedEmail)) {
        throw new FeedbackValidationError("CONTACT_EMAIL_INVALID")
    }

    return normalizedEmail
}
