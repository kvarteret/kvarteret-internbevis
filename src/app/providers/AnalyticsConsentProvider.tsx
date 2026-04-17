import React, {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react"
import {
    getCurrentAnalyticsConsentStatus,
    getHasSeenAnalyticsPromptCurrentVersion,
    markAnalyticsPromptSeen,
    setAnalyticsConsent,
} from "@/features/privacy/data/analyticsConsentRepository"
import {
    AnalyticsConsentSource,
    AnalyticsConsentStatus,
    AnalyticsPromptSource,
} from "@/features/privacy/domain/analyticsConsent"

interface AnalyticsConsentContextValue {
    analyticsConsentStatus: AnalyticsConsentStatus | null
    hasSeenAnalyticsPromptCurrentVersion: boolean
    isAnalyticsEnabled: boolean
    isHydrating: boolean
    grantAnalyticsConsent: (source: AnalyticsConsentSource) => Promise<void>
    declineAnalyticsConsent: (source: AnalyticsConsentSource) => Promise<void>
    markAnalyticsPromptSeen: (source: AnalyticsPromptSource) => Promise<void>
}

const AnalyticsConsentContext = createContext<AnalyticsConsentContextValue | undefined>(undefined)

export const AnalyticsConsentProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    const [analyticsConsentStatus, setAnalyticsConsentStatus] =
        useState<AnalyticsConsentStatus | null>(null)
    const [hasSeenAnalyticsPromptCurrentVersion, setHasSeenAnalyticsPromptCurrentVersion] =
        useState(false)
    const [isHydrating, setIsHydrating] = useState(true)

    useEffect(() => {
        const hydrateAnalyticsConsent = async (): Promise<void> => {
            try {
                const [currentConsentStatus, hasSeenCurrentPrompt] = await Promise.all([
                    getCurrentAnalyticsConsentStatus(),
                    getHasSeenAnalyticsPromptCurrentVersion(),
                ])

                setAnalyticsConsentStatus(currentConsentStatus)
                setHasSeenAnalyticsPromptCurrentVersion(hasSeenCurrentPrompt)
            } catch {
                setAnalyticsConsentStatus(null)
                setHasSeenAnalyticsPromptCurrentVersion(false)
            } finally {
                setIsHydrating(false)
            }
        }

        void hydrateAnalyticsConsent()
    }, [])

    const updateConsentStatus = useCallback(
        async (status: AnalyticsConsentStatus, source: AnalyticsConsentSource): Promise<void> => {
            await Promise.all([
                setAnalyticsConsent(status, source),
                markAnalyticsPromptSeen(source),
            ])
            const [currentConsentStatus, hasSeenCurrentPrompt] = await Promise.all([
                getCurrentAnalyticsConsentStatus(),
                getHasSeenAnalyticsPromptCurrentVersion(),
            ])
            setAnalyticsConsentStatus(currentConsentStatus)
            setHasSeenAnalyticsPromptCurrentVersion(hasSeenCurrentPrompt)
        },
        [],
    )

    const grantAnalyticsConsent = useCallback(
        async (source: AnalyticsConsentSource): Promise<void> => {
            await updateConsentStatus("granted", source)
        },
        [updateConsentStatus],
    )

    const declineAnalyticsConsent = useCallback(
        async (source: AnalyticsConsentSource): Promise<void> => {
            await updateConsentStatus("declined", source)
        },
        [updateConsentStatus],
    )

    const markCurrentAnalyticsPromptSeen = useCallback(
        async (source: AnalyticsPromptSource): Promise<void> => {
            await markAnalyticsPromptSeen(source)
            setHasSeenAnalyticsPromptCurrentVersion(await getHasSeenAnalyticsPromptCurrentVersion())
        },
        [],
    )

    const value = useMemo(
        () => ({
            analyticsConsentStatus,
            hasSeenAnalyticsPromptCurrentVersion,
            isAnalyticsEnabled: analyticsConsentStatus === "granted",
            isHydrating,
            grantAnalyticsConsent,
            declineAnalyticsConsent,
            markAnalyticsPromptSeen: markCurrentAnalyticsPromptSeen,
        }),
        [
            analyticsConsentStatus,
            declineAnalyticsConsent,
            grantAnalyticsConsent,
            hasSeenAnalyticsPromptCurrentVersion,
            isHydrating,
            markCurrentAnalyticsPromptSeen,
        ],
    )

    return (
        <AnalyticsConsentContext.Provider value={value}>
            {children}
        </AnalyticsConsentContext.Provider>
    )
}

export const useAnalyticsConsent = (): AnalyticsConsentContextValue => {
    const context = useContext(AnalyticsConsentContext)
    if (!context) {
        throw new Error("useAnalyticsConsent must be used within an AnalyticsConsentProvider")
    }

    return context
}
