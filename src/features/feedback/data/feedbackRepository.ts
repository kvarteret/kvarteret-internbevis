import { appEnv } from "@/app/config/env"
import {
    buildFeedbackPayload,
    buildSubmittedAtLabel,
    FeedbackSubmissionInput,
    FeedbackUserContext,
} from "@/features/feedback/domain/feedback"

export interface SubmitFeedbackInput {
    contactAllowed: boolean
    contactEmail?: string | null
    message: string
    page: string
    platform: string
    user?: FeedbackUserContext | null
}

const getFeedbackWebhookUrl = (): string => {
    const webhookUrl = appEnv.feedbackWebhookUrl.trim()

    if (!webhookUrl) {
        throw new Error("Feedback webhook is not configured.")
    }

    return webhookUrl
}

const buildSubmission = (input: SubmitFeedbackInput): FeedbackSubmissionInput => ({
    contactAllowed: input.contactAllowed,
    contactEmail: input.contactEmail ?? null,
    message: input.message,
    page: input.page,
    platform: input.platform,
    submittedAt: buildSubmittedAtLabel(),
    user: input.user ?? null,
})

export const submitFeedback = async (input: SubmitFeedbackInput): Promise<void> => {
    const response = await fetch(getFeedbackWebhookUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(buildFeedbackPayload(buildSubmission(input))),
    })

    if (!response.ok) {
        throw new Error(`Feedback webhook failed with status ${response.status}.`)
    }
}
