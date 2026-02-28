import { QueryClientProvider } from "@tanstack/react-query"
import React, { PropsWithChildren } from "react"
import { DeepLinkProvider } from "@/app/providers/DeepLinkProvider"
import { MD3LightTheme, PaperProvider } from "react-native-paper"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { LanguageProvider } from "@/app/providers/LanguageProvider"
import { queryClient } from "@/app/providers/queryClient"
import { SessionProvider } from "@/app/providers/SessionProvider"
import { themeColors } from "@/shared/theme/colors"
import { BlurTargetProvider } from "@/shared/ui/blur/BlurTargetProvider"

const paperTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: themeColors.brandPrimary,
        surface: themeColors.surface,
        background: themeColors.background,
        onSurface: themeColors.editorialInk,
        onSurfaceVariant: themeColors.textSecondary,
        error: themeColors.stateDanger,
    },
}

export const AppProviders = ({ children }: PropsWithChildren): React.JSX.Element => {
    return (
        <SafeAreaProvider>
            <BlurTargetProvider>
                <PaperProvider theme={paperTheme}>
                    <QueryClientProvider client={queryClient}>
                        <DeepLinkProvider>
                            <LanguageProvider>
                                <SessionProvider>{children}</SessionProvider>
                            </LanguageProvider>
                        </DeepLinkProvider>
                    </QueryClientProvider>
                </PaperProvider>
            </BlurTargetProvider>
        </SafeAreaProvider>
    )
}
