import { QueryClientProvider } from "@tanstack/react-query"
import React, { PropsWithChildren } from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { LanguageProvider } from "@/app/providers/LanguageProvider"
import { SessionProvider } from "@/app/providers/SessionProvider"
import { queryClient } from "@/app/providers/queryClient"

export const AppProviders = ({ children }: PropsWithChildren): React.JSX.Element => {
    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <LanguageProvider>
                    <SessionProvider>{children}</SessionProvider>
                </LanguageProvider>
            </QueryClientProvider>
        </SafeAreaProvider>
    )
}
