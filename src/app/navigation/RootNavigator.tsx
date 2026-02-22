import { createNativeStackNavigator } from "@react-navigation/native-stack"
import React from "react"
import { RootStackParamList } from "@/app/navigation/types"
import { useSession } from "@/app/providers/SessionProvider"
import { LoginScreen } from "@/features/auth/ui/screens/LoginScreen"
import { EventDetailsScreen } from "@/features/dashboard/ui/screens/EventDetailsScreen"
import { HomeScreen } from "@/features/dashboard/ui/screens/HomeScreen"
import { GamesScreen } from "@/features/games/ui/screens/GamesScreen"
import { KvarteretSkjermScreen } from "@/features/now-playing/ui/screens/KvarteretSkjermScreen"
import { PrivacyScreen } from "@/features/privacy/ui/screens/PrivacyScreen"

const Stack = createNativeStackNavigator<RootStackParamList>()

export const RootNavigator = (): React.JSX.Element => {
    const { user } = useSession()

    return (
        <Stack.Navigator
            screenOptions={{
                headerBackTitle: "",
                headerTintColor: "#000000",
            }}
        >
            {user ? (
                <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
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
            <Stack.Screen
                name="EventDetails"
                component={EventDetailsScreen}
                options={{
                    headerLargeTitle: false,
                    headerBackTitle: "",
                    headerShadowVisible: false,
                    headerStyle: {
                        backgroundColor: "#F3E2CC",
                    },
                    headerTintColor: "#000000",
                    headerTitleStyle: {
                        color: "#000000",
                    },
                }}
            />
        </Stack.Navigator>
    )
}
