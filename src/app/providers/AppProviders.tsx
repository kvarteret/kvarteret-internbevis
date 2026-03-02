import { QueryClientProvider } from "@tanstack/react-query"
import React, { PropsWithChildren, useMemo } from "react"
import { DeepLinkProvider } from "@/app/providers/DeepLinkProvider"
import { MD3LightTheme, PaperProvider } from "react-native-paper"
import { Uniwind } from "uniwind"
import { LanguageProvider } from "@/app/providers/LanguageProvider"
import { queryClient } from "@/app/providers/queryClient"
import { SessionProvider } from "@/app/providers/SessionProvider"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { BlurTargetProvider } from "@/shared/ui/blur/BlurTargetProvider"
import { SafeAreaListener, SafeAreaProvider } from "@/shared/ui/interop"

export const AppProviders = ({ children }: PropsWithChildren): React.JSX.Element => {
    const colors = useThemeRuntimeColors()
    const paperTheme = useMemo(
        () => ({
            ...MD3LightTheme,
            colors: {
                ...MD3LightTheme.colors,
                primary: colors.brandPrimary,
                surface: colors.surface,
                background: colors.background,
                onSurface: colors.editorialInk,
                onSurfaceVariant: colors.textSecondary,
                error: colors.stateDanger,
            },
        }),
        [colors],
    )

    return (
        <SafeAreaProvider>
            <SafeAreaListener
                onChange={({ insets }) => {
                    Uniwind.updateInsets(insets)
                }}
            >
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
            </SafeAreaListener>
        </SafeAreaProvider>
    )
}
