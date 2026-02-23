import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Tabs } from "expo-router"
import React from "react"

export default function TabsLayoutWeb(): React.JSX.Element {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: "#0F766E",
                tabBarInactiveTintColor: "#374151",
                tabBarStyle: {
                    backgroundColor: "#F3E2CC",
                    borderTopColor: "#D1D5DB",
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "600",
                },
                tabBarItemStyle: {
                    minWidth: 140,
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
