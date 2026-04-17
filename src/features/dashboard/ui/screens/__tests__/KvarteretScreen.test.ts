import React from "react"
import TestRenderer, { act } from "react-test-renderer"
import { KvarteretScreen } from "../KvarteretScreen"

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockGrantAnalyticsConsent = jest.fn()
const mockMarkAnalyticsPromptSeen = jest.fn()
const mockUseAnalyticsConsent = jest.fn()
const mockUsePrivacyConsent = jest.fn()
const mockUseSession = jest.fn()
const mockUseQuery = jest.fn()

jest.mock("expo-router", () => ({
    useRouter: () => ({
        push: mockPush,
        replace: mockReplace,
    }),
}))

jest.mock("@react-navigation/native", () => ({
    useIsFocused: () => true,
}))

jest.mock("@tanstack/react-query", () => ({
    useQuery: (options: unknown) => mockUseQuery(options),
}))

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

jest.mock("@/app/providers/SessionProvider", () => ({
    useSession: () => mockUseSession(),
}))

jest.mock("@/app/providers/PrivacyConsentProvider", () => ({
    usePrivacyConsent: () => mockUsePrivacyConsent(),
}))

jest.mock("@/app/providers/AnalyticsConsentProvider", () => ({
    useAnalyticsConsent: () => mockUseAnalyticsConsent(),
}))

jest.mock("@/shared/theme/use-theme-runtime-colors", () => ({
    useThemeRuntimeColors: () => ({
        textPrimary: "#111827",
    }),
}))

jest.mock("@/features/dashboard/data/eventsRepository", () => ({
    fetchHomeEvents: jest.fn(),
}))

jest.mock("@/features/now-playing/data/nowPlayingRepository", () => ({
    fetchNowPlaying: jest.fn(),
}))

jest.mock("@/features/dashboard/ui/components/DashboardShellLayout", () => ({
    DashboardShellLayout: ({ children }: { children: React.ReactNode }) =>
        require("react").createElement(require("react-native").View, null, children),
}))

jest.mock("@/features/dashboard/ui/components/EventCarousel", () => ({
    EventCarousel: () =>
        require("react").createElement(require("react-native").View, { testID: "event-carousel" }),
}))

jest.mock("@/shared/ui/CachedImage", () => ({
    CachedImage: () =>
        require("react").createElement(require("react-native").View, { testID: "cached-image" }),
}))

jest.mock("@/shared/ui/Card", () => ({
    Card: ({ children }: { children: React.ReactNode }) =>
        require("react").createElement(require("react-native").View, null, children),
}))

jest.mock("@/shared/ui/EtjenestenFooter", () => ({
    EtjenestenFooter: () =>
        require("react").createElement(require("react-native").View, { testID: "footer" }),
}))

jest.mock("@/shared/ui/Text", () => ({
    Text: ({ children, ...props }: { children: React.ReactNode }) =>
        require("react").createElement(require("react-native").Text, props, children),
}))

jest.mock("@/shared/ui/Button", () => ({
    Button: ({
        children,
        onPress,
        ...props
    }: {
        children: React.ReactNode
        onPress?: () => void
    }) =>
        require("react").createElement(
            require("react-native").Text,
            { ...props, onPress },
            children,
        ),
}))

describe("KvarteretScreen", () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockUseSession.mockReturnValue({
            user: null,
            isLoading: false,
        })
        mockUsePrivacyConsent.mockReturnValue({
            hasAcknowledgedCurrentPolicy: true,
        })
        mockUseAnalyticsConsent.mockReturnValue({
            analyticsConsentStatus: null,
            grantAnalyticsConsent: mockGrantAnalyticsConsent,
            hasSeenAnalyticsPromptCurrentVersion: false,
            isHydrating: false,
            markAnalyticsPromptSeen: mockMarkAnalyticsPromptSeen,
        })
        mockGrantAnalyticsConsent.mockResolvedValue(undefined)
        mockMarkAnalyticsPromptSeen.mockResolvedValue(undefined)

        mockUseQuery.mockImplementation(({ queryKey }: { queryKey: string[] }) => {
            if (queryKey[0] === "home-events") {
                return {
                    data: [],
                    isPending: false,
                    isError: false,
                    refetch: jest.fn(),
                }
            }

            return {
                data: null,
                isError: false,
            }
        })
    })

    it("does not redirect guests to login when no session exists", () => {
        let tree: TestRenderer.ReactTestRenderer | null = null

        act(() => {
            tree = TestRenderer.create(React.createElement(KvarteretScreen))
        })

        expect(tree).not.toBeNull()
        expect(mockReplace).not.toHaveBeenCalled()
    })

    it("shows the analytics prompt once when analytics is undecided", () => {
        let tree: TestRenderer.ReactTestRenderer | null = null

        act(() => {
            tree = TestRenderer.create(React.createElement(KvarteretScreen))
        })

        const texts = (tree as TestRenderer.ReactTestRenderer).root
            .findAllByType(require("react-native").Text)
            .map(node => node.props.children)
            .flat()

        expect(texts).toContain("analyticsPromptTitle")
        expect(texts).toContain("analyticsPromptAccept")
        expect(texts).toContain("analyticsPromptSkip")
    })

    it("allows opting in to analytics from the inline prompt", async () => {
        let tree: TestRenderer.ReactTestRenderer | null = null

        act(() => {
            tree = TestRenderer.create(React.createElement(KvarteretScreen))
        })

        const button = (tree as TestRenderer.ReactTestRenderer).root.findByProps({
            children: "analyticsPromptAccept",
        })

        await act(async () => {
            button.props.onPress()
        })

        expect(mockGrantAnalyticsConsent).toHaveBeenCalledWith("kvarteret_prompt")
    })

    it("marks the prompt as seen when the user chooses not now", async () => {
        let tree: TestRenderer.ReactTestRenderer | null = null

        act(() => {
            tree = TestRenderer.create(React.createElement(KvarteretScreen))
        })

        const button = (tree as TestRenderer.ReactTestRenderer).root.findByProps({
            children: "analyticsPromptSkip",
        })

        await act(async () => {
            button.props.onPress()
        })

        expect(mockMarkAnalyticsPromptSeen).toHaveBeenCalledWith("kvarteret_prompt")
    })

    it("does not show the prompt again after it has been seen for the current policy version", () => {
        mockUseAnalyticsConsent.mockReturnValue({
            analyticsConsentStatus: null,
            grantAnalyticsConsent: mockGrantAnalyticsConsent,
            hasSeenAnalyticsPromptCurrentVersion: true,
            isHydrating: false,
            markAnalyticsPromptSeen: mockMarkAnalyticsPromptSeen,
        })

        let tree: TestRenderer.ReactTestRenderer | null = null

        act(() => {
            tree = TestRenderer.create(React.createElement(KvarteretScreen))
        })

        const texts = (tree as TestRenderer.ReactTestRenderer).root
            .findAllByType(require("react-native").Text)
            .map(node => node.props.children)
            .flat()

        expect(texts).not.toContain("analyticsPromptTitle")
    })
})
