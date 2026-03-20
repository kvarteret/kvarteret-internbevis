import { Redirect } from "expo-router"
import React from "react"
import { useSession } from "@/app/providers/SessionProvider"

export default function IndexRoute(): React.JSX.Element {
    const { user, isAnonymous, hasStoredCredentials } = useSession()

    if (user || isAnonymous || hasStoredCredentials) {
        return <Redirect href="/(tabs)/kvarteret" />
    }

    return <Redirect href="/login" />
}
