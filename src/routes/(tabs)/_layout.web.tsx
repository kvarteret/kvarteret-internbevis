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
                tabBarInactiveTintColor: themeColors.textSecondary,
                tabBarStyle: {
                    backgroundColor: themeColors.background,
                    borderTopColor: themeColors.editorialBorder,
                    borderTopWidth: 0.6,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "600",
                },
                tabBarItemStyle: {
                    minWidth: 136,
                },
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
