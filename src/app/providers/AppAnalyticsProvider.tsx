import { usePathname } from "expo-router"
import { usePostHog } from "posthog-react-native"
import React, {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
} from "react"
import { Platform } from "react-native"
import { useAnalyticsConsent } from "@/app/providers/AnalyticsConsentProvider"
import { hasPostHogConfig } from "@/app/providers/AppPostHogProvider"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { usePrivacyConsent } from "@/app/providers/PrivacyConsentProvider"
import { useSession } from "@/app/providers/SessionProvider"
import {
    AnalyticsEventName,
    AnalyticsEventProperties,
    buildAnalyticsDefaultProperties,
} from "@/features/analytics/domain/analytics"

interface AppAnalyticsContextValue {
    track: <TEventName extends AnalyticsEventName>(
        eventName: TEventName,
        properties?: AnalyticsEventProperties[TEventName],
    ) => void
}

const noopTrack: AppAnalyticsContextValue["track"] = () => {}

const AppAnalyticsContext = createContext<AppAnalyticsContextValue>({
    track: noopTrack,
})

const EnabledAppAnalyticsProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    const posthog = usePostHog()
    const pathname = usePathname()
    const { language } = useLanguage()
    const { isAnalyticsEnabled, isHydrating: analyticsHydrating } = useAnalyticsConsent()
    const { hasAcknowledgedCurrentPolicy, isHydrating: privacyHydrating } = usePrivacyConsent()
    const { user, isAnonymous } = useSession()
    const lastScreenSignatureRef = useRef<string | null>(null)

    const defaultProperties = useMemo(
        () =>
            buildAnalyticsDefaultProperties({
                hasUser: Boolean(user),
                isAnonymous,
                language,
                pathname,
                platform: Platform.OS,
            }),
        [isAnonymous, language, pathname, user],
    )
    const canTrack =
        hasAcknowledgedCurrentPolicy &&
        isAnalyticsEnabled &&
        !privacyHydrating &&
        !analyticsHydrating

    useEffect(() => {
        const syncPostHogConsent = async (): Promise<void> => {
            if (canTrack) {
                await posthog.optIn()
                return
            }

            lastScreenSignatureRef.current = null
            await posthog.optOut()
        }

        void syncPostHogConsent()
    }, [canTrack, posthog])

    useEffect(() => {
        if (!canTrack || !pathname) {
            return
        }

        const signature = JSON.stringify({
            pathname,
            defaultProperties,
        })

        if (lastScreenSignatureRef.current === signature) {
            return
        }

        lastScreenSignatureRef.current = signature
        posthog.screen(pathname, defaultProperties)
    }, [canTrack, defaultProperties, pathname, posthog])

    const track = useCallback<AppAnalyticsContextValue["track"]>(
        (eventName, properties) => {
            if (!canTrack) {
                return
            }

            posthog.capture(eventName, {
                ...defaultProperties,
                ...properties,
            })
        },
        [canTrack, defaultProperties, posthog],
    )

    const value = useMemo(
        () => ({
            track,
        }),
        [track],
    )

    return <AppAnalyticsContext.Provider value={value}>{children}</AppAnalyticsContext.Provider>
}

export const AppAnalyticsProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    if (!hasPostHogConfig) {
        return (
            <AppAnalyticsContext.Provider value={{ track: noopTrack }}>
                {children}
            </AppAnalyticsContext.Provider>
        )
    }

    return <EnabledAppAnalyticsProvider>{children}</EnabledAppAnalyticsProvider>
}

export const useAppAnalytics = (): AppAnalyticsContextValue => useContext(AppAnalyticsContext)
