import { createNativeStackNavigator } from "@react-navigation/native-stack"
import React from "react"
import { RootStackParamList } from "@/app/navigation/types"
import { useSession } from "@/app/providers/SessionProvider"
import { LoginScreen } from "@/features/auth/ui/screens/LoginScreen"
import { EventDetailsScreen } from "@/features/dashboard/ui/screens/EventDetailsScreen"
import { HomeScreen } from "@/features/dashboard/ui/screens/HomeScreen"
import { ProfileRolesScreen } from "@/features/dashboard/ui/screens/ProfileRolesScreen"
import { GamesScreen } from "@/features/games/ui/screens/GamesScreen"
import { PrivacyScreen } from "@/features/privacy/ui/screens/PrivacyScreen"

const Stack = createNativeStackNavigator<RootStackParamList>()

export const RootNavigator = (): React.JSX.Element => {
    const { user, isAnonymous } = useSession()

    return (
        <Stack.Navigator
            screenOptions={{
                contentStyle: { backgroundColor: "#F3E2CC" },
                headerStyle: { backgroundColor: "#F3E2CC" },
                headerBackTitle: "",
                headerTintColor: "#000000",
            }}
        >
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
                    presentation: "fullScreenModal",
                    animation: "slide_from_bottom",
                    headerShadowVisible: false,
                }}
            />
            <Stack.Screen name="Privacy" component={PrivacyScreen} />
            <Stack.Screen name="Games" component={GamesScreen} />
            <Stack.Screen
                name="EventDetails"
                component={EventDetailsScreen}
                options={{
                    headerLargeTitle: false,
                    headerShadowVisible: false,
                    headerTitleStyle: {
                        color: "#000000",
                    },
                }}
            />
        </Stack.Navigator>
    )
}
