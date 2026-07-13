import { useCallback, useState } from "react"
import {
    extractFriendlyErrorMessage,
    requestAccessToken,
} from "@/features/auth/data/authRepository"

export interface UseOtpRequestResult {
    requestCode: (email: string) => Promise<boolean>
    isSending: boolean
    requestError: string | null
    clearRequestError: () => void
}

// Requests a one-time login code for an e-mail address (initial send and
// resend), holding the in-flight flag and the user-facing error message.
export const useOtpRequest = (): UseOtpRequestResult => {
    const [isSending, setIsSending] = useState(false)
    const [requestError, setRequestError] = useState<string | null>(null)

    const requestCode = useCallback(async (email: string): Promise<boolean> => {
        setIsSending(true)
        setRequestError(null)

        try {
            await requestAccessToken(email)
            return true
        } catch (error) {
            setRequestError(extractFriendlyErrorMessage(error))
            return false
        } finally {
            setIsSending(false)
        }
    }, [])

    const clearRequestError = useCallback((): void => {
        setRequestError(null)
    }, [])

    return { requestCode, isSending, requestError, clearRequestError }
}
