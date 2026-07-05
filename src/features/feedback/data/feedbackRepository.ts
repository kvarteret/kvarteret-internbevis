import { appEnv } from "@/app/config/env"
import type { FeedbackUserContext } from "@/features/feedback/domain/feedback"

export interface SubmitFeedbackInput {
    contactAllowed: boolean
    contactEmail?: string | null
    message: string
    page: string
    platform: string
    user?: FeedbackUserContext | null
}

export const submitFeedback = async (input: SubmitFeedbackInput): Promise<void> => {
    const url = `${appEnv.kvarteretPersonalApiBaseUrl}/feedback`

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            source: "internbevis-rn",
            message: input.message,
            page: input.page,
            platform: input.platform,
            contact_allowed: input.contactAllowed,
            contact_email: input.contactAllowed ? (input.contactEmail ?? null) : null,
            user_id: input.user?.id ?? null,
            user_full_name: input.user?.fullName ?? null,
        }),
    })

    if (!response.ok) {
        throw new Error(`Feedback submission failed with status ${response.status}.`)
    }
}
