import * as Clipboard from "expo-clipboard"
import Constants from "expo-constants"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"
import { useSession } from "@/app/providers/SessionProvider"
import { extractAccessTokenFromManualInput } from "@/core/linking/deepLinkParser"
import { consumePendingDeepLinkToken } from "@/core/linking/pendingToken"
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
    privacyPolicyChecked: boolean
    languageSelectorVisible: boolean
    isExpoGo: boolean
    showDemoButton: boolean
    normalizedEmail: string
    canSubmitEmail: boolean
    canSubmitOtp: boolean
    performTokenLogin: (token: string) => Promise<boolean>
    setEmail: (value: string) => void
    setOtpCode: (value: string) => void
    togglePrivacy: () => void
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
    const { loginWithToken, setUser, continueAnonymously } = useSession()

    const [mode, setMode] = useState<LoginMode>("email")
    const [email, setEmail] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [emailErrorText, setEmailErrorText] = useState<string | null>(null)
    const [otpFieldErrorText, setOtpFieldErrorText] = useState<string | null>(null)
    const [globalErrorText, setGlobalErrorText] = useState<string | null>(null)
    const [sendingOtp, setSendingOtp] = useState(false)
    const [privacyPolicyChecked, setPrivacyPolicyChecked] = useState(false)
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)

    const normalizedEmail = useMemo(() => normalizeEmail(email), [email])

    const resetVerifyErrors = useCallback((): void => {
        setOtpFieldErrorText(null)
        setGlobalErrorText(null)
    }, [])

    const performTokenLogin = useCallback(
        async (token: string): Promise<boolean> => {
            const result = await loginWithToken(normalizedEmail, token)
            if (!result.success) {
                setGlobalErrorText(result.message ?? t("invalidAccessToken"))
                return false
            }
            return true
        },
        [loginWithToken, normalizedEmail, t],
    )

    const submitEmail = useCallback(async (): Promise<void> => {
        setEmailErrorText(null)

        if (!privacyPolicyChecked) {
            Alert.alert(t("privacyPolicyConsentAlertHeader"), t("privacyPolicyConsentAlert"))
            return
        }

        if (!isEmailValid(normalizedEmail)) {
            setEmailErrorText(t("invalidEmail"))
            return
        }

        setSendingOtp(true)

        try {
            const deepLinkToken = consumePendingDeepLinkToken()
            if (deepLinkToken) {
                const deepLinkLoginResult = await loginWithToken(normalizedEmail, deepLinkToken)
                if (deepLinkLoginResult.success) {
                    return
                }
            }

            await requestAccessToken(normalizedEmail)
            setMode("verify")
        } catch (error) {
            setEmailErrorText(extractFriendlyErrorMessage(error))
        } finally {
            setSendingOtp(false)
        }
    }, [loginWithToken, normalizedEmail, privacyPolicyChecked, t])

    const submitOtp = useCallback(async (): Promise<void> => {
        resetVerifyErrors()

        if (!otpCode.trim()) {
            setOtpFieldErrorText(t("pleaseEnterCode"))
            return
        }

        await performTokenLogin(otpCode.trim())
    }, [otpCode, performTokenLogin, resetVerifyErrors, t])

    const resendOtp = useCallback(async (): Promise<void> => {
        resetVerifyErrors()

        try {
            const success = await requestAccessToken(normalizedEmail)
            if (success) {
                Alert.alert(t("status"), t("newCodeSent"))
            }
        } catch (error) {
            setGlobalErrorText(extractFriendlyErrorMessage(error) || t("couldNotSendCode"))
        }
    }, [normalizedEmail, resetVerifyErrors, t])

    const useClipboardLink = useCallback(async (): Promise<void> => {
        resetVerifyErrors()

        const clipboardText = await Clipboard.getStringAsync()
        const accessToken = extractAccessTokenFromManualInput(clipboardText)

        if (!accessToken) {
            setGlobalErrorText(t("expoGoClipboardNoToken"))
            return
        }

        await performTokenLogin(accessToken)
    }, [performTokenLogin, resetVerifyErrors, t])

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
        void continueAnonymously()
    }, [continueAnonymously])

    return {
        mode,
        email,
        otpCode,
        emailErrorText,
        otpFieldErrorText,
        globalErrorText,
        sendingOtp,
        privacyPolicyChecked,
        languageSelectorVisible,
        isExpoGo,
        showDemoButton: __DEV__,
        normalizedEmail,
        canSubmitEmail: isEmailValid(normalizedEmail) && privacyPolicyChecked && !sendingOtp,
        canSubmitOtp: otpCode.trim().length > 0,
        performTokenLogin,
        setEmail,
        setOtpCode,
        togglePrivacy: () => setPrivacyPolicyChecked(previous => !previous),
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
