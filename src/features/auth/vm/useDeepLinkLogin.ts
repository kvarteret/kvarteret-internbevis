import { useEffect, useRef } from "react"
import { Linking } from "react-native"
import { extractAccessTokenFromUrl } from "@/core/linking/deepLinkParser"

type LoginMode = "email" | "verify"

export const useDeepLinkLogin = (
    mode: LoginMode,
    performTokenLogin: (token: string) => Promise<boolean>,
): void => {
    const handlingDeepLinkRef = useRef(false)

    useEffect(() => {
        if (mode !== "verify") {
            return
        }

        let mounted = true

        const handleUrl = async (url: string): Promise<void> => {
            if (handlingDeepLinkRef.current || !mounted) {
                return
            }

            const accessToken = extractAccessTokenFromUrl(url)
            if (!accessToken) {
                return
            }

            handlingDeepLinkRef.current = true
            try {
                await performTokenLogin(accessToken)
            } finally {
                handlingDeepLinkRef.current = false
            }
        }

        void Linking.getInitialURL().then(url => {
            if (url) {
                void handleUrl(url)
            }
        })

        const subscription = Linking.addEventListener("url", event => {
            void handleUrl(event.url)
        })

        return () => {
            mounted = false
            subscription.remove()
        }
    }, [mode, performTokenLogin])
}
