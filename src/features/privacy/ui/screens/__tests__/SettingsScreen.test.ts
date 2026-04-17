import React from "react"
import TestRenderer, { act } from "react-test-renderer"
import { SettingsScreen } from "../SettingsScreen"

const mockPush = jest.fn()
const mockSetOptions = jest.fn()
const mockGrantAnalyticsConsent = jest.fn()
const mockDeclineAnalyticsConsent = jest.fn()
const mockUseAnalyticsConsent = jest.fn()

jest.mock("expo-router", () => ({
    useNavigation: () => ({
        setOptions: mockSetOptions,
    }),
    useRouter: () => ({
        push: mockPush,
    }),
}))

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

jest.mock("@/app/providers/AnalyticsConsentProvider", () => ({
    useAnalyticsConsent: () => mockUseAnalyticsConsent(),
}))

jest.mock("@/shared/ui/Card", () => ({
    Card: ({ children }: { children: React.ReactNode }) =>
        require("react").createElement(require("react-native").View, null, children),
}))

jest.mock("@/shared/ui/Text", () => ({
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
        require("react").createElement(require("react-native").Text, props, children),
}))

jest.mock("@/shared/ui/Button", () => ({
    Button: ({ children, onPress, ...props }: { children: React.ReactNode; onPress?: () => void }) =>
        require("react").createElement(require("react-native").Text, { ...props, onPress }, children),
}))

jest.mock("@/shared/ui/EtjenestenFooter", () => ({
    EtjenestenFooter: () =>
        require("react").createElement(require("react-native").View, { testID: "footer" }),
}))

describe("SettingsScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGrantAnalyticsConsent.mockResolvedValue(undefined)
        mockDeclineAnalyticsConsent.mockResolvedValue(undefined)
        mockUseAnalyticsConsent.mockReturnValue({
            analyticsConsentStatus: null,
            declineAnalyticsConsent: mockDeclineAnalyticsConsent,
            grantAnalyticsConsent: mockGrantAnalyticsConsent,
        })
    })

    it("allows enabling analytics from settings after skipping the prompt", async () => {
        let tree: TestRenderer.ReactTestRenderer | null = null

        act(() => {
            tree = TestRenderer.create(React.createElement(SettingsScreen))
        })

        const button = (tree as TestRenderer.ReactTestRenderer).root.findByProps({
            children: "analyticsSettingsEnable",
        })

        await act(async () => {
            button.props.onPress()
        })

        expect(mockGrantAnalyticsConsent).toHaveBeenCalledWith("settings")
    })

    it("allows disabling analytics from settings after opting in", async () => {
        mockUseAnalyticsConsent.mockReturnValue({
            analyticsConsentStatus: "granted",
            declineAnalyticsConsent: mockDeclineAnalyticsConsent,
            grantAnalyticsConsent: mockGrantAnalyticsConsent,
        })

        let tree: TestRenderer.ReactTestRenderer | null = null

        act(() => {
            tree = TestRenderer.create(React.createElement(SettingsScreen))
        })

        const button = (tree as TestRenderer.ReactTestRenderer).root.findByProps({
            children: "analyticsSettingsDisable",
        })

        await act(async () => {
            button.props.onPress()
        })

        expect(mockDeclineAnalyticsConsent).toHaveBeenCalledWith("settings")
    })
})
