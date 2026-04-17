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
    acknowledgeCurrentPrivacyPolicy,
    getAcknowledgedPrivacyPolicyVersion,
} from "@/features/privacy/data/privacyConsentRepository"
import { isCurrentPrivacyPolicyAcknowledged } from "@/features/privacy/domain/privacyConsent"

interface PrivacyConsentContextValue {
    hasAcknowledgedCurrentPolicy: boolean
    isHydrating: boolean
    acknowledgeCurrentPolicy: () => Promise<void>
}

const PrivacyConsentContext = createContext<PrivacyConsentContextValue | undefined>(undefined)

export const PrivacyConsentProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    const [acknowledgedVersion, setAcknowledgedVersion] = useState<string | null>(null)
    const [isHydrating, setIsHydrating] = useState(true)

    useEffect(() => {
        const hydrateAcknowledgedVersion = async (): Promise<void> => {
            try {
                setAcknowledgedVersion(await getAcknowledgedPrivacyPolicyVersion())
            } catch {
                setAcknowledgedVersion(null)
            } finally {
                setIsHydrating(false)
            }
        }

        void hydrateAcknowledgedVersion()
    }, [])

    const acknowledgeCurrentPolicy = useCallback(async (): Promise<void> => {
        await acknowledgeCurrentPrivacyPolicy()
        setAcknowledgedVersion(await getAcknowledgedPrivacyPolicyVersion())
    }, [])

    const value = useMemo(
        () => ({
            hasAcknowledgedCurrentPolicy: isCurrentPrivacyPolicyAcknowledged(acknowledgedVersion),
            isHydrating,
            acknowledgeCurrentPolicy,
        }),
        [acknowledgeCurrentPolicy, acknowledgedVersion, isHydrating],
    )

    return <PrivacyConsentContext.Provider value={value}>{children}</PrivacyConsentContext.Provider>
}

export const usePrivacyConsent = (): PrivacyConsentContextValue => {
    const context = useContext(PrivacyConsentContext)
    if (!context) {
        throw new Error("usePrivacyConsent must be used within a PrivacyConsentProvider")
    }

    return context
}
