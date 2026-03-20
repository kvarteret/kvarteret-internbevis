export const appEnv = {
    internkortBaseUrl:
        process.env.EXPO_PUBLIC_INTERNKORT_BASE_URL?.trim() ||
        "https://personal.kvarteret.no/api/v1/mobile-card",
    supabaseUrl:
        process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() ||
        "https://jeezqitchepgwxjknwhz.supabase.co",
    supabaseAnonKey:
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
        "sb_publishable_z2eZR6_Ao8Uc8qfmrvNj1A_0AjgALRO",
}
