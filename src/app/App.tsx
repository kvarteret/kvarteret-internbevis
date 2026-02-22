import { NavigationContainer } from "@react-navigation/native"
import React, { useEffect } from "react"
import { ActivityIndicator, Linking, View } from "react-native"
import "@/app/localization/i18n"
import { RootNavigator } from "@/app/navigation/RootNavigator"
import { AppProviders } from "@/app/providers/AppProviders"
import { useSession } from "@/app/providers/SessionProvider"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { extractAccessTokenFromUrl } from "@/core/linking/deepLinkParser"
import { setPendingDeepLinkToken } from "@/core/linking/pendingToken"

const AppRoot = (): React.JSX.Element => {
    const { isHydrating: sessionHydrating } = useSession()
    const { isHydrating: languageHydrating } = useLanguage()

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

    if (sessionHydrating || languageHydrating) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color="#000000" size="large" />
            </View>
        )
    }

    return (
        <NavigationContainer>
            <RootNavigator />
        </NavigationContainer>
    )
}

export const App = (): React.JSX.Element => {
    return (
        <AppProviders>
            <AppRoot />
        </AppProviders>
    )
}
