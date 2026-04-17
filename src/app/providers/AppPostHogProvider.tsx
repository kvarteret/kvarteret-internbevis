import { PostHogProvider } from "posthog-react-native"
import React, { PropsWithChildren } from "react"
import { appEnv } from "@/app/config/env"
import { useAnalyticsConsent } from "@/app/providers/AnalyticsConsentProvider"
import { usePrivacyConsent } from "@/app/providers/PrivacyConsentProvider"

export const hasPostHogConfig =
    appEnv.posthogEnabled && appEnv.posthogApiKey.length > 0 && appEnv.posthogHost.length > 0

export const AppPostHogProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    const { isAnalyticsEnabled, isHydrating: analyticsHydrating } = useAnalyticsConsent()
    const { hasAcknowledgedCurrentPolicy, isHydrating: privacyHydrating } = usePrivacyConsent()

    if (!hasPostHogConfig) {
        return <>{children}</>
    }

    return (
        <PostHogProvider
            apiKey={appEnv.posthogApiKey}
            autocapture={false}
            debug={appEnv.posthogDebug}
            options={{
                host: appEnv.posthogHost,
                disabled:
                    privacyHydrating ||
                    analyticsHydrating ||
                    !hasAcknowledgedCurrentPolicy ||
                    !isAnalyticsEnabled,
            }}
        >
            {children}
        </PostHogProvider>
    )
}
