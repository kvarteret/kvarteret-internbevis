import React, {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react"
import { getStoredValue, removeStoredValue, setStoredValue } from "@/core/storage/asyncStorage"
import {
    AuthResult,
    authResultFromError,
    clearCredentials,
    clearDeepLinkToken,
    getInternkortInformation,
    getInternkortInformationByPhone,
    getSavedCredentials,
    loginWithFirebaseToken,
    saveCredentials,
    saveDeepLinkToken,
    savePhoneCredentials,
} from "@/features/auth/data/authRepository"
import {
    getHydrationErrorMessage,
    shouldClearCredentialsOnHydrationError,
} from "@/features/auth/domain/authHydration"
import {
    buildDisplayRoles,
    hasPersistedRoleSelectionMatch,
    isPersistedRoleSelection,
    PersistedRoleSelection,
    resolveDisplayedRole,
    serializeRoleSelection,
} from "@/features/dashboard/domain/profileRoles"
import { User } from "@/shared/types/user"

interface SessionContextValue {
    user: User | null
    isAnonymous: boolean
    selectedFrontpageRoleSelection: PersistedRoleSelection | null
    isHydrating: boolean
    isLoading: boolean
    error: string | null
    setUser: (nextUser: User | null) => void
    continueAnonymously: () => Promise<void>
    exitAnonymousMode: () => Promise<void>
    setSelectedFrontpageRoleSelection: (selection: PersistedRoleSelection | null) => Promise<void>
    loginWithToken: (email: string, accessToken: string) => Promise<AuthResult>
    loginWithFirebase: (idToken: string, phone: string) => Promise<AuthResult>
    logout: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)
const FRONT_PAGE_ROLE_STORAGE_KEY_PREFIX = "selected_frontpage_role"
const ANONYMOUS_MODE_STORAGE_KEY = "anonymous_mode"

const getFrontPageRoleStorageKey = (userId: number): string =>
    `${FRONT_PAGE_ROLE_STORAGE_KEY_PREFIX}:${userId}`

const parsePersistedRoleSelection = (rawValue: string | null): PersistedRoleSelection | null => {
    if (!rawValue) {
        return null
    }

    try {
        const parsed = JSON.parse(rawValue) as unknown
        return isPersistedRoleSelection(parsed) ? parsed : null
    } catch {
        return null
    }
}

export const SessionProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    const [user, setUser] = useState<User | null>(null)
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [selectedFrontpageRoleSelection, setSelectedFrontpageRoleSelectionState] =
        useState<PersistedRoleSelection | null>(null)
    const [isHydrating, setIsHydrating] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const hydrateUser = async (): Promise<void> => {
            try {
                const credentials = await getSavedCredentials()
                let hydratedUser: User | null = null

                if (credentials.phone && credentials.accessToken) {
                    try {
                        hydratedUser = await getInternkortInformationByPhone(
                            credentials.phone,
                            credentials.accessToken,
                        )
                    } catch {
                        // Phone hydration failed; fall through to email
                    }
                }

                if (!hydratedUser && credentials.email && credentials.accessToken) {
                    hydratedUser = await getInternkortInformation(
                        credentials.email,
                        credentials.accessToken,
                    )
                }

                if (hydratedUser) {
                    setUser(hydratedUser)
                    setIsAnonymous(false)
                    setError(null)
                    await removeStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
                    return
                }

                setUser(null)
                const anonymousFlag = await getStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
                setIsAnonymous(anonymousFlag === "true")
                setError(null)
            } catch (nextError) {
                if (shouldClearCredentialsOnHydrationError(nextError)) {
                    await clearCredentials()
                    await clearDeepLinkToken()
                }

                setUser(null)
                try {
                    const anonymousFlag = await getStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
                    setIsAnonymous(anonymousFlag === "true")
                } catch {
                    setIsAnonymous(false)
                }
                setError(getHydrationErrorMessage(nextError))
            } finally {
                setIsHydrating(false)
            }
        }

        void hydrateUser()
    }, [])

    useEffect(() => {
        const hydrateFrontpageRoleSelection = async (): Promise<void> => {
            try {
                if (!user) {
                    setSelectedFrontpageRoleSelectionState(null)
                    return
                }

                const storageKey = getFrontPageRoleStorageKey(user.id)
                const rawSelection = await getStoredValue(storageKey)
                const parsedSelection = parsePersistedRoleSelection(rawSelection)
                const roles = buildDisplayRoles(user)
                const resolvedRole = resolveDisplayedRole(roles, parsedSelection)

                if (!parsedSelection) {
                    setSelectedFrontpageRoleSelectionState(null)
                    return
                }

                if (!resolvedRole) {
                    setSelectedFrontpageRoleSelectionState(null)
                    await removeStoredValue(storageKey)
                    return
                }

                if (!hasPersistedRoleSelectionMatch(roles, parsedSelection)) {
                    const fallbackSelection = serializeRoleSelection(resolvedRole)
                    setSelectedFrontpageRoleSelectionState(fallbackSelection)
                    await setStoredValue(storageKey, JSON.stringify(fallbackSelection))
                    return
                }

                setSelectedFrontpageRoleSelectionState(parsedSelection)
            } catch {
                setSelectedFrontpageRoleSelectionState(null)
            }
        }

        void hydrateFrontpageRoleSelection()
    }, [user])

    const setSelectedFrontpageRoleSelection = async (
        selection: PersistedRoleSelection | null,
    ): Promise<void> => {
        setSelectedFrontpageRoleSelectionState(selection)

        try {
            if (!user) {
                return
            }

            const storageKey = getFrontPageRoleStorageKey(user.id)
            if (!selection) {
                await removeStoredValue(storageKey)
                return
            }

            await setStoredValue(storageKey, JSON.stringify(selection))
        } catch {
            // Keep in-memory selection even if persistence temporarily fails.
        }
    }

    const loginWithToken = async (email: string, accessToken: string): Promise<AuthResult> => {
        setIsLoading(true)
        setError(null)

        try {
            const nextUser = await getInternkortInformation(email, accessToken)
            await saveCredentials(email, accessToken)
            await saveDeepLinkToken(accessToken)
            setUser(nextUser)
            setIsAnonymous(false)
            await removeStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
            return { success: true, status: 200 }
        } catch (nextError) {
            if (shouldClearCredentialsOnHydrationError(nextError)) {
                await clearDeepLinkToken()
            }

            const failedResult = authResultFromError(nextError)
            setError(failedResult.message ?? null)
            return failedResult
        } finally {
            setIsLoading(false)
        }
    }

    const loginWithFirebase = async (idToken: string, phone: string): Promise<AuthResult> => {
        setIsLoading(true)
        setError(null)

        try {
            const { user: nextUser, accessToken } = await loginWithFirebaseToken(idToken)
            await savePhoneCredentials(phone, accessToken)
            setUser(nextUser)
            setIsAnonymous(false)
            await removeStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
            return { success: true, status: 200 }
        } catch (nextError) {
            const failedResult = authResultFromError(nextError)
            setError(failedResult.message ?? null)
            return failedResult
        } finally {
            setIsLoading(false)
        }
    }

    const continueAnonymously = async (): Promise<void> => {
        setIsAnonymous(true)

        try {
            await setStoredValue(ANONYMOUS_MODE_STORAGE_KEY, "true")
        } catch {
            // Keep in-memory anonymous mode even if persistence temporarily fails.
        }
    }

    const exitAnonymousMode = async (): Promise<void> => {
        setIsAnonymous(false)

        try {
            await removeStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
        } catch {
            // Keep in-memory state even if persistence temporarily fails.
        }
    }

    const logout = async (): Promise<void> => {
        await clearCredentials()
        await clearDeepLinkToken()
        await removeStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
        setIsAnonymous(false)
        setSelectedFrontpageRoleSelectionState(null)
        setUser(null)
    }

    const value = useMemo(
        () => ({
            user,
            isAnonymous,
            selectedFrontpageRoleSelection,
            isHydrating,
            isLoading,
            error,
            setUser,
            continueAnonymously,
            exitAnonymousMode,
            setSelectedFrontpageRoleSelection,
            loginWithToken,
            loginWithFirebase,
            logout,
        }),
        [
            continueAnonymously,
            error,
            exitAnonymousMode,
            isAnonymous,
            isHydrating,
            isLoading,
            selectedFrontpageRoleSelection,
            user,
        ],
    )

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export const useSession = (): SessionContextValue => {
    const context = useContext(SessionContext)
    if (!context) {
        throw new Error("useSession must be used within a SessionProvider")
    }

    return context
}
