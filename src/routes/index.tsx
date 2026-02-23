import { Redirect } from "expo-router"
import React from "react"
import { useSession } from "@/app/providers/SessionProvider"

export default function IndexRoute(): React.JSX.Element {
    const { user, isAnonymous } = useSession()

    if (user || isAnonymous) {
        return <Redirect href="/(tabs)/kontroll" />
    }

    return <Redirect href="/login" />
}
