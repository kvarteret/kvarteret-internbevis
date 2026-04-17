import React from "react"
import { Alert } from "react-native"
import TestRenderer, { act } from "react-test-renderer"
import { requestAccessToken } from "@/features/auth/data/authRepository"
import { type UseLoginFormResult, useLoginForm } from "@/features/auth/vm/useLoginForm"

const mockLoginWithToken = jest.fn()
const mockSetUser = jest.fn()
const mockContinueAnonymously = jest.fn()

jest.mock("expo-clipboard", () => ({
    getStringAsync: jest.fn(),
}))

jest.mock("expo-constants", () => ({
    __esModule: true,
    default: {
        executionEnvironment: "standalone",
    },
}))

jest.mock("react-i18next", () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}))

jest.mock("@/app/providers/AppAnalyticsProvider", () => ({
    useAppAnalytics: () => ({
        track: jest.fn(),
    }),
}))

jest.mock("@/app/providers/SessionProvider", () => ({
    useSession: () => ({
        loginWithToken: mockLoginWithToken,
        setUser: mockSetUser,
        continueAnonymously: mockContinueAnonymously,
    }),
}))

jest.mock("@/core/linking/deepLinkParser", () => ({
    extractAccessTokenFromManualInput: jest.fn(),
}))

jest.mock("@/core/linking/pendingToken", () => ({
    consumePendingDeepLinkToken: jest.fn(() => null),
}))

jest.mock("@/features/auth/data/authRepository", () => ({
    extractFriendlyErrorMessage: jest.fn(() => "friendly-error"),
    requestAccessToken: jest.fn(),
}))

const renderHook = (): {
    getLatest: () => UseLoginFormResult
} => {
    let latest: UseLoginFormResult | null = null

    const Harness = (): React.JSX.Element => {
        latest = useLoginForm()
        return React.createElement(React.Fragment)
    }

    act(() => {
        TestRenderer.create(React.createElement(Harness))
    })

    return {
        getLatest: (): UseLoginFormResult => latest as UseLoginFormResult,
    }
}

describe("useLoginForm", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockLoginWithToken.mockResolvedValue({ success: true })
        mockContinueAnonymously.mockResolvedValue(undefined)
        ;(requestAccessToken as jest.Mock).mockResolvedValue(true)
    })

    it("requests an access token without blocking on a second privacy consent step", async () => {
        const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(jest.fn())
        const { getLatest } = renderHook()

        act(() => {
            getLatest().setEmail("reodor@kvarteret.no")
        })

        await act(async () => {
            await getLatest().submitEmail()
        })

        expect(requestAccessToken).toHaveBeenCalledWith("reodor@kvarteret.no")
        expect(getLatest().mode).toBe("verify")
        expect(alertSpy).not.toHaveBeenCalled()
    })
})
