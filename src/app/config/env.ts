export const appEnv = {
    internkortBaseUrl:
        process.env.EXPO_PUBLIC_INTERNKORT_BASE_URL?.trim() ||
        "https://personal.kvarteret.no/api/v1/mobile-card",
}
