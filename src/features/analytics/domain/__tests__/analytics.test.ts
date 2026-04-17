import {
    buildAnalyticsDefaultProperties,
    getAnalyticsDestinationHost,
    resolveAnalyticsAppArea,
} from "@/features/analytics/domain/analytics"

describe("analytics domain helpers", () => {
    it("resolves app areas from routed paths", () => {
        expect(resolveAnalyticsAppArea("/login")).toBe("auth")
        expect(resolveAnalyticsAppArea("/feedback")).toBe("feedback")
        expect(resolveAnalyticsAppArea("/event/123")).toBe("events")
        expect(resolveAnalyticsAppArea("/privacy-update")).toBe("privacy")
        expect(resolveAnalyticsAppArea("/settings")).toBe("privacy")
        expect(resolveAnalyticsAppArea("/games")).toBe("games")
    })

    it("builds default analytics properties with identified auth state", () => {
        expect(
            buildAnalyticsDefaultProperties({
                hasUser: true,
                isAnonymous: false,
                language: "no",
                pathname: "/about",
                platform: "ios",
            }),
        ).toEqual({
            app_area: "about",
            auth_state: "identified",
            language: "no",
            platform: "ios",
            product: "kvarteret",
            surface: "mobile_app",
        })
    })

    it("extracts destination hosts from URLs", () => {
        expect(getAnalyticsDestinationHost("https://blifrivillig.no/bli")).toBe("blifrivillig.no")
        expect(getAnalyticsDestinationHost("mailto:it.leder@kvarteret.no")).toBe("kvarteret.no")
    })
})
