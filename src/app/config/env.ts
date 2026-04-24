export const appEnv = {
    kvarteretPersonalApiBaseUrl:
        process.env.EXPO_PUBLIC_KVARTERET_PERSONAL_API_BASE_URL?.trim() ||
        "https://personal.kvarteret.no/api/v1",
    internkortBaseUrl:
        process.env.EXPO_PUBLIC_INTERNKORT_BASE_URL?.trim() ||
        "https://personal.kvarteret.no/api/v1/mobile-card",
    feedbackWebhookUrl: process.env.EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL?.trim() || "",
}
