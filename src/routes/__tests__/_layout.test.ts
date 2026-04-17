import React from "react"
import { ActivityIndicator, Alert } from "react-native"
import TestRenderer, { act } from "react-test-renderer"

jest.mock("../../../global.css", () => ({}))
jest.mock("@/app/localization/i18n", () => ({}))

const mockAlert = jest.fn()
const mockUseSession = jest.fn()
const mockUseLanguage = jest.fn()
const mockUsePrivacyConsent = jest.fn()
const mockUseHeaderMenuActions = jest.fn()
const mockUseThemeRuntimeColors = jest.fn()
const mockUseNavigationStyles = jest.fn()
const mockUseRouter = jest.fn()
const mockUseSegments = jest.fn()

jest.mock("expo-router", () => {
    const React = require("react")
    const { Text } = require("react-native")

    const Stack = ({ children }: { children: React.ReactNode }) =>
        React.createElement(Text, { testID: "root-stack" }, children)
    Stack.Screen = ({ name }: { name: string }) =>
        React.createElement(Text, { testID: `screen-${name}` }, name)

    return {
        Stack,
        useRouter: () => mockUseRouter(),
        useSegments: () => mockUseSegments(),
    }
})

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

jest.mock("@/app/providers/AppProviders", () => ({
    AppProviders: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock("@/app/providers/SessionProvider", () => ({
    useSession: () => mockUseSession(),
}))

jest.mock("@/app/providers/LanguageProvider", () => ({
    useLanguage: () => mockUseLanguage(),
}))

jest.mock("@/app/providers/PrivacyConsentProvider", () => ({
    usePrivacyConsent: () => mockUsePrivacyConsent(),
}))

jest.mock("@/features/dashboard/ui/menu/useHeaderMenuActions", () => ({
    useHeaderMenuActions: () => mockUseHeaderMenuActions(),
}))

jest.mock("@/shared/theme/use-theme-runtime-colors", () => ({
    useThemeRuntimeColors: () => mockUseThemeRuntimeColors(),
}))

jest.mock("@/shared/theme/use-navigation-styles", () => ({
    useNavigationStyles: () => mockUseNavigationStyles(),
}))

jest.mock("@/features/dashboard/ui/components/AndroidHeaderMenuButton", () => ({
    AndroidHeaderMenuButton: () =>
        require("react").createElement(require("react-native").Text, null, "menu-button"),
}))

describe("RootLayout", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(Alert, "alert").mockImplementation((...args) => mockAlert(...args))

        mockUseRouter.mockReturnValue({
            push: jest.fn(),
        })
        mockUseSegments.mockReturnValue(["(tabs)"])
        mockUseSession.mockReturnValue({
            user: null,
            isAnonymous: false,
            isHydrating: false,
        })
        mockUseLanguage.mockReturnValue({
            isHydrating: false,
        })
        mockUsePrivacyConsent.mockReturnValue({
            hasAcknowledgedCurrentPolicy: true,
            isHydrating: false,
            acknowledgeCurrentPolicy: jest.fn(),
        })
        mockUseHeaderMenuActions.mockReturnValue({
            menuActions: [],
            nativeMenuItems: [],
            onMenuAction: jest.fn(),
        })
        mockUseThemeRuntimeColors.mockReturnValue({
            textPrimary: "#111827",
            editorialInk: "#111827",
        })
        mockUseNavigationStyles.mockReturnValue({
            rootContentStyle: {},
            androidHeaderStyle: {},
        })
    })

    it("renders the normal app flow without an analytics-specific startup gate", async () => {
        const RootLayout = require("../_layout").default
        let tree: TestRenderer.ReactTestRenderer | null = null

        await act(async () => {
            tree = TestRenderer.create(React.createElement(RootLayout))
        })

        expect(
            (tree as TestRenderer.ReactTestRenderer).root.findAllByType(ActivityIndicator),
        ).toHaveLength(0)
        expect(
            (tree as TestRenderer.ReactTestRenderer).root.findAllByProps({
                testID: "root-stack",
            }).length,
        ).toBeGreaterThan(0)
    })

    it("does not show a blocking analytics alert from the root layout", async () => {
        const RootLayout = require("../_layout").default

        await act(async () => {
            TestRenderer.create(React.createElement(RootLayout))
        })

        expect(mockAlert).not.toHaveBeenCalled()
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })
})
