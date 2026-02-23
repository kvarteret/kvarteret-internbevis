import {
    NativeStackNavigationOptions,
    createNativeStackNavigator,
} from "@react-navigation/native-stack"
import React from "react"
import { Platform } from "react-native"
import { RootStackParamList } from "@/app/navigation/types"
import { useSession } from "@/app/providers/SessionProvider"
import { LoginScreen } from "@/features/auth/ui/screens/LoginScreen"
import { EventDetailsScreen } from "@/features/dashboard/ui/screens/EventDetailsScreen"
import { HomeScreen } from "@/features/dashboard/ui/screens/HomeScreen"
import { ProfileRolesScreen } from "@/features/dashboard/ui/screens/ProfileRolesScreen"
import { GamesScreen } from "@/features/games/ui/screens/GamesScreen"
import { PrivacyScreen } from "@/features/privacy/ui/screens/PrivacyScreen"

const Stack = createNativeStackNavigator<RootStackParamList>()
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

export const RootNavigator = (): React.JSX.Element => {
    const { user, isAnonymous } = useSession()

    const rootScreenOptions: NativeStackNavigationOptions = {
        contentStyle: { backgroundColor: "#F3E2CC" },
        headerBackTitle: "",
        headerTintColor: "#000000",
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
                  headerStyle: { backgroundColor: "#F3E2CC" },
              }),
    }

    return (
        <Stack.Navigator screenOptions={rootScreenOptions}>
            {user || isAnonymous ? (
                <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            ) : (
                <Stack.Screen
                    name="Login"
                    component={LoginScreen}
                    options={{ headerShown: false }}
                />
            )}
            <Stack.Screen
                name="ProfileRoles"
                component={ProfileRolesScreen}
                options={{
                    presentation: Platform.OS === "ios" ? "pageSheet" : "fullScreenModal",
                    animation: Platform.OS === "ios" ? "default" : "slide_from_bottom",
                }}
            />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="Games" component={GamesScreen} />
            <Stack.Screen
                name="EventDetails"
                component={EventDetailsScreen}
                options={{
                    headerShadowVisible: false,
                    headerTitleStyle: {
                        color: "#000000",
                    },
                }}
            />
        </Stack.Navigator>
    )
}
