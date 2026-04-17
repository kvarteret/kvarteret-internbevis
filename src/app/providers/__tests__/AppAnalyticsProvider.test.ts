import React, { useEffect } from "react"
import TestRenderer, { act } from "react-test-renderer"

const mockCapture = jest.fn()
const mockOptIn = jest.fn()
const mockOptOut = jest.fn()
const mockScreen = jest.fn()
const mockUseAnalyticsConsent = jest.fn()
const mockUsePrivacyConsent = jest.fn()
const mockUseLanguage = jest.fn()
const mockUseSession = jest.fn()
const mockUsePathname = jest.fn()

jest.mock("expo-router", () => ({
    usePathname: () => mockUsePathname(),
}))

jest.mock("posthog-react-native", () => ({
    usePostHog: () => ({
        capture: mockCapture,
        optIn: mockOptIn,
        optOut: mockOptOut,
        screen: mockScreen,
    }),
}))

jest.mock("@/app/providers/AppPostHogProvider", () => ({
    hasPostHogConfig: true,
}))

jest.mock("@/app/providers/AnalyticsConsentProvider", () => ({
    useAnalyticsConsent: () => mockUseAnalyticsConsent(),
}))

jest.mock("@/app/providers/PrivacyConsentProvider", () => ({
    usePrivacyConsent: () => mockUsePrivacyConsent(),
}))

jest.mock("@/app/providers/LanguageProvider", () => ({
    useLanguage: () => mockUseLanguage(),
}))

jest.mock("@/app/providers/SessionProvider", () => ({
    useSession: () => mockUseSession(),
}))

const renderProvider = async ({
    isAnalyticsEnabled,
}: {
    isAnalyticsEnabled: boolean
}): Promise<void> => {
    const { AppAnalyticsProvider, useAppAnalytics } = require("../AppAnalyticsProvider")

    const Harness = (): React.JSX.Element => {
        const { track } = useAppAnalytics()

        useEffect(() => {
            track("menu_item_clicked", {
                destination: "/privacy",
                menu_item_id: "privacy",
            })
        }, [track])

        return React.createElement(React.Fragment)
    }

    mockUseAnalyticsConsent.mockReturnValue({
        isAnalyticsEnabled,
        isHydrating: false,
    })
    mockUsePrivacyConsent.mockReturnValue({
        hasAcknowledgedCurrentPolicy: true,
        isHydrating: false,
    })
    mockUseLanguage.mockReturnValue({
        language: "no",
    })
    mockUseSession.mockReturnValue({
        user: {
            id: "123",
        },
        isAnonymous: false,
    })
    mockUsePathname.mockReturnValue("/privacy")

    await act(async () => {
        TestRenderer.create(
            React.createElement(AppAnalyticsProvider, null, React.createElement(Harness)),
        )
    })
}

describe("AppAnalyticsProvider", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockOptIn.mockResolvedValue(undefined)
        mockOptOut.mockResolvedValue(undefined)
    })

    it("keeps PostHog opted out and suppresses events until explicit opt-in", async () => {
        await renderProvider({
            isAnalyticsEnabled: false,
        })

        expect(mockOptOut).toHaveBeenCalled()
        expect(mockOptIn).not.toHaveBeenCalled()
        expect(mockScreen).not.toHaveBeenCalled()
        expect(mockCapture).not.toHaveBeenCalled()
    })

    it("opts PostHog in and only sends coarse screen plus explicit events after opt-in", async () => {
        await renderProvider({
            isAnalyticsEnabled: true,
        })

        expect(mockOptIn).toHaveBeenCalled()
        expect(mockOptOut).not.toHaveBeenCalled()
        expect(mockScreen).toHaveBeenCalledWith(
            "/privacy",
            expect.objectContaining({
                app_area: "privacy",
                auth_state: "identified",
                language: "no",
                platform: "ios",
            }),
        )
        expect(mockCapture).toHaveBeenCalledWith(
            "menu_item_clicked",
            expect.objectContaining({
                destination: "/privacy",
                menu_item_id: "privacy",
            }),
        )
        expect(mockScreen.mock.calls[0][1]).not.toHaveProperty("id")
    })
})
