import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useFonts } from "expo-font"
import * as Linking from "expo-linking"
import React, { useEffect } from "react"
import { ActivityIndicator, LogBox, View } from "react-native"
import "./global.css"
import "./src/localization/i18n"
import { colors } from "./src/constants/theme"
import { RootStackParamList } from "./src/navigation/types"
import { EventDetailsScreen } from "./src/screens/EventDetailsScreen"
import { GamesScreen } from "./src/screens/GamesScreen"
import { HomeScreen } from "./src/screens/HomeScreen"
import { KvarteretSkjermScreen } from "./src/screens/KvarteretSkjermScreen"
import { LoginScreen } from "./src/screens/LoginScreen"
import { PrivacyScreen } from "./src/screens/PrivacyScreen"
import { extractAccessTokenFromUrl } from "./src/services/deepLinkService"
import { setPendingDeepLinkToken } from "./src/services/pendingDeepLinkToken"
import { LanguageProvider, useLanguage } from "./src/state/LanguageContext"
import { UserProvider, useUser } from "./src/state/UserContext"

const Stack = createNativeStackNavigator<RootStackParamList>()

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 500,
            gcTime: 1000 * 60 * 5,
        },
    },
})

function RootNavigator(): React.JSX.Element {
    const { user, isHydrating: userHydrating } = useUser()
    const { isHydrating: languageHydrating } = useLanguage()

    const [fontsLoaded, fontsError] = useFonts({
        Inter_400Regular: require("./assets/fonts/inter/Inter_400Regular.ttf"),
        Inter_500Medium: require("./assets/fonts/inter/Inter_500Medium.ttf"),
        Inter_600SemiBold: require("./assets/fonts/inter/Inter_600SemiBold.ttf"),
        Inter_700Bold: require("./assets/fonts/inter/Inter_700Bold.ttf"),
        Inter_800ExtraBold: require("./assets/fonts/inter/Inter_800ExtraBold.ttf"),
    })

    const fontsReady = fontsLoaded || Boolean(fontsError)

    useEffect(() => {
        let mounted = true

        const handleUrl = async (url: string): Promise<void> => {
            const accessToken = extractAccessTokenFromUrl(url)
            if (mounted && accessToken) {
                setPendingDeepLinkToken(accessToken)
            }
        }

        void Linking.getInitialURL().then((url: string | null) => {
            if (url) {
                void handleUrl(url)
            }
        })

        const subscription = Linking.addEventListener("url", (event: { url: string }) => {
            void handleUrl(event.url)
        })

        return () => {
            mounted = false
            subscription.remove()
        }
    }, [])

    if (userHydrating || languageHydrating || !fontsReady) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color={colors.primaryText} size="large" />
            </View>
        )
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                screenOptions={{
                    headerBackTitle: "",
                    headerTintColor: colors.primaryText,
                    headerTitleStyle: {
                        fontFamily: "Inter_600SemiBold",
                    },
                }}
            >
                {user ? (
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={{ headerShown: false }}
                    />
                ) : (
                    <Stack.Screen
                        name="Login"
                        component={LoginScreen}
                        options={{ headerShown: false }}
                    />
                )}
                <Stack.Screen name="Privacy" component={PrivacyScreen} />
                <Stack.Screen name="KvarteretSkjerm" component={KvarteretSkjermScreen} />
                <Stack.Screen name="Games" component={GamesScreen} />
                <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}

export default function App(): React.JSX.Element {
    return (
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <UserProvider>
                    <RootNavigator />
                </UserProvider>
            </LanguageProvider>
        </QueryClientProvider>
    )
}
