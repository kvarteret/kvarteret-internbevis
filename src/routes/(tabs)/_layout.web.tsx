import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Tabs } from "expo-router"
import React from "react"
import { themeColors } from "@/shared/theme/colors"

export default function TabsLayoutWeb(): React.JSX.Element {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: themeColors.tabActive,
            }}
        >
            <Tabs.Screen
                name="kontroll"
                options={{
                    title: "Kontroll",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons color={color} name="person" size={size} />
                    ),
                }}
            />
            <Tabs.Screen
                name="kvarteret"
                options={{
                    title: "Kvarteret",
                    tabBarIcon: ({ color, size }) => (
                        <MaterialIcons color={color} name="home" size={size} />
                    ),
                }}
            />
            <Tabs.Screen name="index" options={{ href: null }} />
        </Tabs>
    )
}
