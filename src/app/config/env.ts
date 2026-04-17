const isTruthyEnvValue = (value: string | undefined): boolean => {
    const normalized = value?.trim().toLowerCase()
    return (
        normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on"
    )
}

export const appEnv = {
    internkortBaseUrl:
        process.env.EXPO_PUBLIC_INTERNKORT_BASE_URL?.trim() ||
        "https://personal.kvarteret.no/api/v1/mobile-card",
    feedbackWebhookUrl: process.env.EXPO_PUBLIC_FEEDBACK_WEBHOOK_URL?.trim() || "",
    posthogApiKey: process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim() || "",
    posthogHost: process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.i.posthog.com",
    posthogEnabled: isTruthyEnvValue(process.env.EXPO_PUBLIC_POSTHOG_ENABLED),
    posthogDebug: isTruthyEnvValue(process.env.EXPO_PUBLIC_POSTHOG_DEBUG),
    supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || "https://jeezqitchepgwxjknwhz.supabase.co",
    supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
        "sb_publishable_z2eZR6_Ao8Uc8qfmrvNj1A_0AjgALRO",
}
