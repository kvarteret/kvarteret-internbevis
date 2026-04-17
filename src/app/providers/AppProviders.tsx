import { QueryClientProvider } from "@tanstack/react-query"
import React, { PropsWithChildren, useMemo } from "react"
import { LogBox } from "react-native"
import { MD3LightTheme, PaperProvider } from "react-native-paper"
import { Uniwind } from "uniwind"
import { AnalyticsConsentProvider } from "@/app/providers/AnalyticsConsentProvider"
import { AppAnalyticsProvider } from "@/app/providers/AppAnalyticsProvider"
import { AppPostHogProvider } from "@/app/providers/AppPostHogProvider"
import { DeepLinkProvider } from "@/app/providers/DeepLinkProvider"
import { LanguageProvider } from "@/app/providers/LanguageProvider"
import { PrivacyConsentProvider } from "@/app/providers/PrivacyConsentProvider"
import { queryClient } from "@/app/providers/queryClient"
import { SessionProvider } from "@/app/providers/SessionProvider"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { BlurTargetProvider } from "@/shared/ui/blur/BlurTargetProvider"
import { SafeAreaListener, SafeAreaProvider } from "@/shared/ui/interop"

if (__DEV__) {
    // React Native 0.83 currently emits this native Animated warning during some iOS
    // header/sheet transitions even when no app-owned animated listener is missing.
    LogBox.ignoreLogs(["Sending `onAnimatedValueUpdate` with no listeners registered."])
}

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
                                    <PrivacyConsentProvider>
                                        <AnalyticsConsentProvider>
                                            <SessionProvider>
                                                <AppPostHogProvider>
                                                    <AppAnalyticsProvider>
                                                        {children}
                                                    </AppAnalyticsProvider>
                                                </AppPostHogProvider>
                                            </SessionProvider>
                                        </AnalyticsConsentProvider>
                                    </PrivacyConsentProvider>
                                </LanguageProvider>
                            </DeepLinkProvider>
                        </QueryClientProvider>
                    </PaperProvider>
                </BlurTargetProvider>
            </SafeAreaListener>
        </SafeAreaProvider>
    )
}
