import { User } from "@/shared/types/user"

export const FEEDBACK_PAGE = "/(tabs)/feedback"
export const MAX_FEEDBACK_MESSAGE_LENGTH = 2_000

export type FeedbackValidationErrorCode = "MESSAGE_REQUIRED" | "MESSAGE_TOO_LONG"

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
    message: string
    page: string
    platform: string
    submittedAt: string
    user?: FeedbackUserContext | null
}

interface SlackPayloadField {
    type: "mrkdwn"
    text: string
}

interface SlackPayloadSection {
    type: "section"
    fields?: SlackPayloadField[]
    text?: {
        type: "mrkdwn"
        text: string
    }
}

interface SlackPayloadHeader {
    type: "header"
    text: {
        type: "plain_text"
        text: string
    }
}

interface SlackPayloadDivider {
    type: "divider"
}

export interface SlackPayload {
    text: string
    blocks: (SlackPayloadHeader | SlackPayloadSection | SlackPayloadDivider)[]
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

export const buildSubmittedAtLabel = (date = new Date()): string => {
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")

    return `${day}.${month}.${year} ${hours}:${minutes}`
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

export const escapeSlackText = (value: string): string =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

const buildMetadataFields = (submission: FeedbackSubmissionInput): SlackPayloadField[] => {
    const fields: SlackPayloadField[] = [
        {
            type: "mrkdwn",
            text: `*Kilde*\n${escapeSlackText("internbevis-rn")}`,
        },
        {
            type: "mrkdwn",
            text: `*Side*\n${escapeSlackText(submission.page.trim() || FEEDBACK_PAGE)}`,
        },
        {
            type: "mrkdwn",
            text: `*Plattform*\n${escapeSlackText(submission.platform.trim() || "unknown")}`,
        },
        {
            type: "mrkdwn",
            text: `*Sendt*\n${escapeSlackText(submission.submittedAt.trim())}`,
        },
    ]

    if (submission.user) {
        fields.push({
            type: "mrkdwn",
            text: `*Bruker*\n${escapeSlackText(submission.user.fullName || "Innlogget bruker")}`,
        })
        fields.push({
            type: "mrkdwn",
            text: `*Bruker-ID*\n${escapeSlackText(String(submission.user.id))}`,
        })
    }

    return fields
}

export const buildFeedbackPayload = (submission: FeedbackSubmissionInput): SlackPayload => {
    const normalizedMessage = normalizeFeedbackMessage(submission.message)

    return {
        text: "Ny tilbakemelding fra internbevis-rn",
        blocks: [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: "Ny tilbakemelding til internbevis-appen",
                },
            },
            {
                type: "section",
                fields: buildMetadataFields(submission),
            },
            {
                type: "divider",
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Melding*\n${escapeSlackText(normalizedMessage)}`,
                },
            },
        ],
    }
}
