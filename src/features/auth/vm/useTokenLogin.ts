import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSession } from "@/app/providers/SessionProvider"

export interface UseTokenLoginResult {
    performTokenLogin: (email: string, token: string) => Promise<boolean>
    loginError: string | null
    clearLoginError: () => void
}

// Exchanges an access token (OTP code, deep link, or clipboard link) for a
// session, holding the user-facing error for the verify step.
export const useTokenLogin = (): UseTokenLoginResult => {
    const { t } = useTranslation()
    const { loginWithToken } = useSession()
    const [loginError, setLoginError] = useState<string | null>(null)

    const performTokenLogin = useCallback(
        async (email: string, token: string): Promise<boolean> => {
            const result = await loginWithToken(email, token)
            if (!result.success) {
                setLoginError(result.message ?? t("invalidAccessToken"))
                return false
            }

            setLoginError(null)
            return true
        },
        [loginWithToken, t],
    )

    const clearLoginError = useCallback((): void => {
        setLoginError(null)
    }, [])

    return { performTokenLogin, loginError, clearLoginError }
}
