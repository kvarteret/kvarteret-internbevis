import { isEmailValid, normalizeEmail } from "@/shared/domain/emailValidation"
import { User } from "@/shared/types/user"

export const FEEDBACK_PAGE = "/(tabs)/feedback"
export const MAX_FEEDBACK_MESSAGE_LENGTH = 2_000

// Identifies this app to the backend's feedback endpoint; must match a key
// in kvarteret-personal's `_SOURCE_PROJECT` (app/domain/feedback/service.py).
export const FEEDBACK_SOURCE = "internbevis-rn"

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

export interface FeedbackSubmissionInput {
    contactAllowed: boolean
    contactEmail?: string | null
    message: string
    page: string
    platform: string
    user?: FeedbackUserContext | null
}

// Field-for-field match of the backend's FeedbackRequest model
// (kvarteret-personal app/api/v1/feedback.py) — keep the two in sync.
export interface FeedbackRequestBody {
    message: string
    page: string
    platform: string
    contact_allowed: boolean
    contact_email: string | null
    user_id: number | null
    user_full_name: string | null
    source: string
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

export const buildFeedbackRequestBody = (
    submission: FeedbackSubmissionInput,
): FeedbackRequestBody => {
    const normalizedMessage = normalizeFeedbackMessage(submission.message)
    const normalizedContactEmail = normalizeFeedbackContactEmail(submission.contactEmail)

    return {
        message: normalizedMessage,
        page: submission.page.trim() || FEEDBACK_PAGE,
        platform: submission.platform.trim() || "unknown",
        contact_allowed: submission.contactAllowed,
        contact_email: submission.contactAllowed ? normalizedContactEmail : null,
        user_id: submission.user?.id ?? null,
        user_full_name: submission.user?.fullName ?? null,
        source: FEEDBACK_SOURCE,
    }
}
