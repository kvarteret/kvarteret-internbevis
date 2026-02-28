import React, { PropsWithChildren, useEffect } from "react"
import { Linking } from "react-native"
import { extractAccessTokenFromUrl } from "@/core/linking/deepLinkParser"
import { setPendingDeepLinkToken } from "@/core/linking/pendingToken"

export const DeepLinkProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    useEffect(() => {
        let mounted = true

        const handleUrl = async (url: string): Promise<void> => {
            const accessToken = extractAccessTokenFromUrl(url)
            if (mounted && accessToken) {
                setPendingDeepLinkToken(accessToken)
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
    }, [])

    return <>{children}</>
}
