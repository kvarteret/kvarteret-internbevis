import { Redirect } from "expo-router"
import React from "react"
import { useSession } from "@/app/providers/SessionProvider"
import { ProfileScreen } from "@/features/dashboard/ui/screens/ProfileScreen"

export default function KontrollRoute(): React.JSX.Element {
    const { user } = useSession()

    if (!user) {
        return <Redirect href="/(tabs)/kvarteret" />
    }

    return <ProfileScreen />
}
