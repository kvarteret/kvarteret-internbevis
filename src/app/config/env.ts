export const appEnv = {
    internkortBaseUrl:
        process.env.EXPO_PUBLIC_INTERNKORT_BASE_URL?.trim() ||
        "https://api.kvarteret.no/api/DigitalInternkort",
    kvarteretSkjermBaseUrl:
        process.env.EXPO_PUBLIC_KVARTERET_SKJERM_BASE_URL?.trim() ||
        "https://kvarteret-skjerm.fly.dev",
}
