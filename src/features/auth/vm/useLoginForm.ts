import * as Clipboard from "expo-clipboard"
import Constants from "expo-constants"
import { useCallback, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert } from "react-native"
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth"
import { useSession } from "@/app/providers/SessionProvider"
import { extractAccessTokenFromManualInput } from "@/core/linking/deepLinkParser"
import { consumePendingDeepLinkToken } from "@/core/linking/pendingToken"
import {
    extractFriendlyErrorMessage,
    requestAccessToken,
} from "@/features/auth/data/authRepository"
import { isEmailValid, isPhoneValid, normalizeEmail, normalizePhone } from "@/features/auth/domain/authValidation"
import { createDemoUser } from "@/shared/types/user"

export type LoginMode = "phone" | "email-input" | "verify"
export type AuthMethod = "phone" | "email"

export interface UseLoginFormResult {
    mode: LoginMode
    authMethod: AuthMethod
    email: string
    phone: string
    otpCode: string
    emailErrorText: string | null
    phoneErrorText: string | null
    otpFieldErrorText: string | null
    globalErrorText: string | null
    sendingOtp: boolean
    privacyPolicyChecked: boolean
    languageSelectorVisible: boolean
    isExpoGo: boolean
    showDemoButton: boolean
    normalizedEmail: string
    normalizedPhone: string
    canSubmitEmail: boolean
    canSubmitPhone: boolean
    canSubmitOtp: boolean
    performTokenLogin: (token: string) => Promise<boolean>
    setEmail: (value: string) => void
    setPhone: (value: string) => void
    setOtpCode: (value: string) => void
    togglePrivacy: () => void
    openLanguageSelector: () => void
    closeLanguageSelector: () => void
    backToPhone: () => void
    submitPhone: () => Promise<void>
    submitEmail: () => Promise<void>
    submitOtp: () => Promise<void>
    resendOtp: () => Promise<void>
    useClipboardLink: () => Promise<void>
    switchToEmailFallback: () => void
    loginDemo: () => void
    continueAnonymous: () => void
}

export const useLoginForm = (): UseLoginFormResult => {
    const { t } = useTranslation()
    const isExpoGo = Constants.executionEnvironment === "storeClient"
    const { loginWithToken, loginWithFirebase, setUser, continueAnonymously } = useSession()

    const [mode, setMode] = useState<LoginMode>("phone")
    const [authMethod, setAuthMethod] = useState<AuthMethod>("phone")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [emailErrorText, setEmailErrorText] = useState<string | null>(null)
    const [phoneErrorText, setPhoneErrorText] = useState<string | null>(null)
    const [otpFieldErrorText, setOtpFieldErrorText] = useState<string | null>(null)
    const [globalErrorText, setGlobalErrorText] = useState<string | null>(null)
    const [sendingOtp, setSendingOtp] = useState(false)
    const [privacyPolicyChecked, setPrivacyPolicyChecked] = useState(false)
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)

    const confirmationResultRef = useRef<FirebaseAuthTypes.ConfirmationResult | null>(null)

    const normalizedEmail = useMemo(() => normalizeEmail(email), [email])
    const normalizedPhone = useMemo(() => normalizePhone(phone), [phone])

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

    const submitPhone = useCallback(async (): Promise<void> => {
        setPhoneErrorText(null)

        if (!privacyPolicyChecked) {
            Alert.alert(t("privacyPolicyConsentAlertHeader"), t("privacyPolicyConsentAlert"))
            return
        }

        if (!isPhoneValid(phone)) {
            setPhoneErrorText(t("invalidPhone"))
            return
        }

        setSendingOtp(true)
        try {
            const confirmation = await auth().signInWithPhoneNumber(normalizedPhone)
            confirmationResultRef.current = confirmation
            setAuthMethod("phone")
            setMode("verify")
        } catch (error) {
            setPhoneErrorText(extractFriendlyErrorMessage(error))
        } finally {
            setSendingOtp(false)
        }
    }, [normalizedPhone, phone, privacyPolicyChecked, t])

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
            setAuthMethod("email")
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

        if (authMethod === "phone") {
            if (!confirmationResultRef.current) {
                setGlobalErrorText(t("phoneFallbackError"))
                return
            }
            try {
                const userCredential = await confirmationResultRef.current.confirm(otpCode.trim())
                if (!userCredential) {
                    setOtpFieldErrorText(t("invalidAccessToken"))
                    return
                }
                const idToken = await userCredential.user.getIdToken()
                const result = await loginWithFirebase(idToken, normalizedPhone)
                if (!result.success) {
                    setGlobalErrorText(result.message ?? t("invalidAccessToken"))
                }
            } catch (error) {
                setOtpFieldErrorText(extractFriendlyErrorMessage(error))
            }
        } else {
            await performTokenLogin(otpCode.trim())
        }
    }, [authMethod, loginWithFirebase, normalizedPhone, otpCode, performTokenLogin, resetVerifyErrors, t])

    const resendOtp = useCallback(async (): Promise<void> => {
        resetVerifyErrors()

        if (authMethod === "phone") {
            await submitPhone()
        } else {
            try {
                const success = await requestAccessToken(normalizedEmail)
                if (success) {
                    Alert.alert(t("status"), t("newCodeSent"))
                }
            } catch (error) {
                setGlobalErrorText(extractFriendlyErrorMessage(error) || t("couldNotSendCode"))
            }
        }
    }, [authMethod, normalizedEmail, resetVerifyErrors, submitPhone, t])

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

    const backToPhone = useCallback((): void => {
        setMode("phone")
        setAuthMethod("phone")
        setOtpCode("")
        confirmationResultRef.current = null
        resetVerifyErrors()
    }, [resetVerifyErrors])

    const switchToEmailFallback = useCallback((): void => {
        setMode("email-input")
        setAuthMethod("email")
        setOtpCode("")
        confirmationResultRef.current = null
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
        authMethod,
        email,
        phone,
        otpCode,
        emailErrorText,
        phoneErrorText,
        otpFieldErrorText,
        globalErrorText,
        sendingOtp,
        privacyPolicyChecked,
        languageSelectorVisible,
        isExpoGo,
        showDemoButton: __DEV__,
        normalizedEmail,
        normalizedPhone,
        canSubmitEmail: isEmailValid(normalizedEmail) && privacyPolicyChecked && !sendingOtp,
        canSubmitPhone: isPhoneValid(phone) && privacyPolicyChecked && !sendingOtp,
        canSubmitOtp: otpCode.trim().length > 0,
        performTokenLogin,
        setEmail,
        setPhone,
        setOtpCode,
        togglePrivacy: () => setPrivacyPolicyChecked(previous => !previous),
        openLanguageSelector: () => setLanguageSelectorVisible(true),
        closeLanguageSelector: () => setLanguageSelectorVisible(false),
        backToPhone,
        submitPhone,
        submitEmail,
        submitOtp,
        resendOtp,
        useClipboardLink,
        switchToEmailFallback,
        loginDemo,
        continueAnonymous,
    }
}
