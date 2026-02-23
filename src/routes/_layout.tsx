import { NativeStackNavigationOptions } from "@react-navigation/native-stack"
import { Stack } from "expo-router"
import React, { useEffect } from "react"
import { ActivityIndicator, Linking, Platform, View } from "react-native"
import "../../global.css"
import "@/app/localization/i18n"
import { AppProviders } from "@/app/providers/AppProviders"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { useSession } from "@/app/providers/SessionProvider"
import { extractAccessTokenFromUrl } from "@/core/linking/deepLinkParser"
import { setPendingDeepLinkToken } from "@/core/linking/pendingToken"
import { themeColors } from "@/shared/theme/colors"

const IOS_SCROLL_EDGE_VERSION = 26

const getMajorIOSVersion = (): number | null => {
    if (Platform.OS !== "ios") return null

    if (typeof Platform.Version === "number") {
        return Number.isFinite(Platform.Version) ? Math.trunc(Platform.Version) : null
    }

    if (typeof Platform.Version === "string") {
        const [major = ""] = Platform.Version.split(".")
        const parsed = Number.parseInt(major, 10)
        return Number.isFinite(parsed) ? parsed : null
    }

    return null
}

const IOS_MAJOR_VERSION = getMajorIOSVersion()
const SUPPORTS_SCROLL_EDGE_EFFECTS =
    Platform.OS === "ios" &&
    IOS_MAJOR_VERSION !== null &&
    IOS_MAJOR_VERSION >= IOS_SCROLL_EDGE_VERSION

const RootNavigator = (): React.JSX.Element => {
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
                <ActivityIndicator color={themeColors.textPrimary} size="large" />
            </View>
        )
    }

    const rootScreenOptions: NativeStackNavigationOptions = {
        contentStyle: { backgroundColor: themeColors.background },
        headerBackTitle: "",
        headerTintColor: themeColors.textPrimary,
        ...(Platform.OS === "ios"
            ? {
                  headerTransparent: true,
                  headerShadowVisible: false,
                  headerBackButtonDisplayMode: "minimal" as const,
                  ...(SUPPORTS_SCROLL_EDGE_EFFECTS
                      ? {
                            scrollEdgeEffects: {
                                top: "automatic",
                            },
                        }
                      : {
                            headerBlurEffect: "systemMaterial",
                        }),
              }
            : {
                  headerStyle: { backgroundColor: themeColors.background },
              }),
    }

    return (
        <Stack screenOptions={rootScreenOptions}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
                name="profile-roles"
                options={{
                    presentation: Platform.OS === "ios" ? "pageSheet" : "fullScreenModal",
                    animation: Platform.OS === "ios" ? "default" : "slide_from_bottom",
                }}
            />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="about" />
            <Stack.Screen name="games" />
            <Stack.Screen
                name="event/[eventId]"
                options={{
                    headerShadowVisible: false,
                    headerTitleStyle: {
                        color: themeColors.textPrimary,
                    },
                }}
            />
        </Stack>
    )
}

export default function RootLayout(): React.JSX.Element {
    return (
        <AppProviders>
            <RootNavigator />
        </AppProviders>
    )
}
