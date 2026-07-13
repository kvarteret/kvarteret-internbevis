import { z } from "zod"
import { appEnv } from "@/app/config/env"
import {
    buildFeedbackRequestBody,
    type FeedbackUserContext,
} from "@/features/feedback/domain/feedback"

export interface SubmitFeedbackInput {
    contactAllowed: boolean
    contactEmail?: string | null
    message: string
    page: string
    platform: string
    user?: FeedbackUserContext | null
}

const feedbackApiResponseSchema = z.object({
    ok: z.boolean(),
    detail: z.string().optional(),
})

const getFeedbackEndpointUrl = (): string => {
    const base = appEnv.kvarteretPersonalApiBaseUrl.trim()
    const trimmedBase = base.endsWith("/") ? base.slice(0, -1) : base
    return `${trimmedBase}/feedback/`
}

export const submitFeedback = async (input: SubmitFeedbackInput): Promise<void> => {
    const response = await fetch(getFeedbackEndpointUrl(), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(buildFeedbackRequestBody(input)),
    })

    if (response.status === 429) {
        throw new Error("Too many feedback submissions. Please try again later.")
    }

    if (!response.ok) {
        throw new Error(`Feedback request failed with status ${response.status}.`)
    }

    const payload = feedbackApiResponseSchema.parse(await response.json())
    if (!payload.ok) {
        throw new Error(payload.detail || "Feedback could not be sent right now.")
    }
}
