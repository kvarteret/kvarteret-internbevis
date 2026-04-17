import * as Clipboard from "expo-clipboard"
import Constants from "expo-constants"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"
import { useAppAnalytics } from "@/app/providers/AppAnalyticsProvider"
import { useSession } from "@/app/providers/SessionProvider"
import { extractAccessTokenFromManualInput } from "@/core/linking/deepLinkParser"
import { consumePendingDeepLinkToken } from "@/core/linking/pendingToken"
import { ANALYTICS_EVENT, LoginMethod } from "@/features/analytics/domain/analytics"
import {
    extractFriendlyErrorMessage,
    requestAccessToken,
} from "@/features/auth/data/authRepository"
import { isEmailValid, normalizeEmail } from "@/features/auth/domain/authValidation"
import { createDemoUser } from "@/shared/types/user"

export type LoginMode = "email" | "verify"

export interface UseLoginFormResult {
    mode: LoginMode
    email: string
    otpCode: string
    emailErrorText: string | null
    otpFieldErrorText: string | null
    globalErrorText: string | null
    sendingOtp: boolean
    languageSelectorVisible: boolean
    isExpoGo: boolean
    showDemoButton: boolean
    normalizedEmail: string
    performTokenLogin: (token: string, method?: LoginMethod) => Promise<boolean>
    setEmail: (value: string) => void
    setOtpCode: (value: string) => void
    openLanguageSelector: () => void
    closeLanguageSelector: () => void
    backToEmail: () => void
    submitEmail: () => Promise<void>
    submitOtp: () => Promise<void>
    resendOtp: () => Promise<void>
    useClipboardLink: () => Promise<void>
    loginDemo: () => void
    continueAnonymous: () => void
}

export const useLoginForm = (): UseLoginFormResult => {
    const { t } = useTranslation()
    const isExpoGo = Constants.executionEnvironment === "storeClient"
    const { track } = useAppAnalytics()
    const { loginWithToken, setUser, continueAnonymously } = useSession()

    const [mode, setMode] = useState<LoginMode>("email")
    const [email, setEmail] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [emailErrorText, setEmailErrorText] = useState<string | null>(null)
    const [otpFieldErrorText, setOtpFieldErrorText] = useState<string | null>(null)
    const [globalErrorText, setGlobalErrorText] = useState<string | null>(null)
    const [sendingOtp, setSendingOtp] = useState(false)
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)

    const normalizedEmail = useMemo(() => normalizeEmail(email), [email])

    const resetVerifyErrors = useCallback((): void => {
        setOtpFieldErrorText(null)
        setGlobalErrorText(null)
    }, [])

    const performTokenLogin = useCallback(
        async (token: string, method: LoginMethod = "otp"): Promise<boolean> => {
            const result = await loginWithToken(normalizedEmail, token)
            if (!result.success) {
                track(ANALYTICS_EVENT.authLoginFailed, {
                    funnel_area: "account",
                    login_method: method,
                })

                if (method === "deeplink") {
                    track(ANALYTICS_EVENT.authDeeplinkLoginFailed, {
                        funnel_area: "account",
                        login_method: method,
                    })
                }

                setGlobalErrorText(result.message ?? t("invalidAccessToken"))
                return false
            }

            track(ANALYTICS_EVENT.authLoginSucceeded, {
                funnel_area: "account",
                login_method: method,
            })

            if (method === "deeplink") {
                track(ANALYTICS_EVENT.authDeeplinkLoginSucceeded, {
                    funnel_area: "account",
                    login_method: method,
                })
            }

            return true
        },
        [loginWithToken, normalizedEmail, t, track],
    )

    const submitEmail = useCallback(async (): Promise<void> => {
        setEmailErrorText(null)

        if (!isEmailValid(normalizedEmail)) {
            setEmailErrorText(t("invalidEmail"))
            return
        }

        setSendingOtp(true)

        try {
            const deepLinkToken = consumePendingDeepLinkToken()
            if (deepLinkToken) {
                if (await performTokenLogin(deepLinkToken, "deeplink")) {
                    return
                }
            }

            await requestAccessToken(normalizedEmail)
            track(ANALYTICS_EVENT.authCodeRequested, {
                funnel_area: "account",
                login_method: "email",
                request_source: "initial",
            })
            setMode("verify")
        } catch (error) {
            setEmailErrorText(extractFriendlyErrorMessage(error))
            track(ANALYTICS_EVENT.authCodeRequestFailed, {
                funnel_area: "account",
                login_method: "email",
                request_source: "initial",
            })
        } finally {
            setSendingOtp(false)
        }
    }, [normalizedEmail, performTokenLogin, t, track])

    const submitOtp = useCallback(async (): Promise<void> => {
        resetVerifyErrors()

        if (!otpCode.trim()) {
            setOtpFieldErrorText(t("pleaseEnterCode"))
            return
        }

        await performTokenLogin(otpCode.trim(), "otp")
    }, [otpCode, performTokenLogin, resetVerifyErrors, t])

    const resendOtp = useCallback(async (): Promise<void> => {
        resetVerifyErrors()

        try {
            const success = await requestAccessToken(normalizedEmail)
            if (success) {
                track(ANALYTICS_EVENT.authCodeRequested, {
                    funnel_area: "account",
                    login_method: "email",
                    request_source: "resend",
                })
                Alert.alert(t("status"), t("newCodeSent"))
            }
        } catch (error) {
            setGlobalErrorText(extractFriendlyErrorMessage(error) || t("couldNotSendCode"))
            track(ANALYTICS_EVENT.authCodeRequestFailed, {
                funnel_area: "account",
                login_method: "email",
                request_source: "resend",
            })
        }
    }, [normalizedEmail, resetVerifyErrors, t, track])

    const useClipboardLink = useCallback(async (): Promise<void> => {
        resetVerifyErrors()

        const clipboardText = await Clipboard.getStringAsync()
        const accessToken = extractAccessTokenFromManualInput(clipboardText)

        track(ANALYTICS_EVENT.authClipboardLinkUsed, {
            funnel_area: "account",
            has_token: Boolean(accessToken),
        })

        if (!accessToken) {
            setGlobalErrorText(t("expoGoClipboardNoToken"))
            return
        }

        await performTokenLogin(accessToken, "clipboard")
    }, [performTokenLogin, resetVerifyErrors, t, track])

    const backToEmail = useCallback((): void => {
        setMode("email")
        setOtpCode("")
        resetVerifyErrors()
    }, [resetVerifyErrors])

    const loginDemo = useCallback((): void => {
        if (__DEV__) {
            setUser(createDemoUser())
        }
    }, [setUser])

    const continueAnonymous = useCallback((): void => {
        track(ANALYTICS_EVENT.authContinueAnonymous, {
            funnel_area: "account",
        })
        void continueAnonymously()
    }, [continueAnonymously, track])

    return {
        mode,
        email,
        otpCode,
        emailErrorText,
        otpFieldErrorText,
        globalErrorText,
        sendingOtp,
        languageSelectorVisible,
        isExpoGo,
        showDemoButton: __DEV__,
        normalizedEmail,
        performTokenLogin,
        setEmail,
        setOtpCode,
        openLanguageSelector: () => setLanguageSelectorVisible(true),
        closeLanguageSelector: () => setLanguageSelectorVisible(false),
        backToEmail,
        submitEmail,
        submitOtp,
        resendOtp,
        useClipboardLink,
        loginDemo,
        continueAnonymous,
    }
}
