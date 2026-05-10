import { Redirect } from "expo-router"
import React from "react"

export default function TabsIndexRoute(): React.JSX.Element {
    return <Redirect href="/(tabs)/kvarteret" />
}
