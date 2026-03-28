import React, {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react"
import { getStoredValue, removeStoredValue, setStoredValue } from "@/core/storage/asyncStorage"
import { reportSessionLogoutDiagnostic } from "@/features/auth/data/authDiagnosticsRepository"
import {
    AuthResult,
    authResultFromError,
    clearCachedUser,
    clearCredentials,
    clearDeepLinkToken,
    clearLoginMarker,
    createMobileCardSession,
    getCachedUser,
    getInternkortInformation,
    getSavedCredentials,
    getSavedLoginMarker,
    saveCachedUser,
    saveCredentials,
    saveLoginMarker,
} from "@/features/auth/data/authRepository"
import { isTransientAuthError, toAuthServiceError } from "@/features/auth/domain/authError"
import {
    getHydrationErrorMessage,
    shouldClearCredentialsOnHydrationError,
} from "@/features/auth/domain/authHydration"
import {
    arePersistedRoleSelectionsEqual,
    buildDisplayRoles,
    isPersistedRoleSelection,
    isPersistedRoleSelectionArray,
    PersistedRoleSelection,
    resolveDefaultRoleSelections,
    resolvePersistedRoleSelections,
    serializeRoleSelection,
    serializeRoleSelections,
} from "@/features/dashboard/domain/profileRoles"
import { User } from "@/shared/types/user"

interface SessionContextValue {
    user: User | null
    isAnonymous: boolean
    hasStoredCredentials: boolean
    selectedFrontpageRoleSelections: PersistedRoleSelection[]
    isHydrating: boolean
    isLoading: boolean
    error: string | null
    setUser: (nextUser: User | null) => void
    continueAnonymously: () => Promise<void>
    exitAnonymousMode: () => Promise<void>
    setSelectedFrontpageRoleSelections: (selections: PersistedRoleSelection[]) => Promise<void>
    loginWithToken: (email: string, accessToken: string) => Promise<AuthResult>
    logout: () => Promise<void>
}

type ParsedPersistedRoleSelections = {
    format: "array" | "invalid" | "legacy" | "missing"
    selections: PersistedRoleSelection[]
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined)
const FRONT_PAGE_ROLE_STORAGE_KEY_PREFIX = "selected_frontpage_role"
const ANONYMOUS_MODE_STORAGE_KEY = "anonymous_mode"

const getFrontPageRoleStorageKey = (userId: number): string =>
    `${FRONT_PAGE_ROLE_STORAGE_KEY_PREFIX}:${userId}`

const parsePersistedRoleSelections = (rawValue: string | null): ParsedPersistedRoleSelections => {
    if (!rawValue) {
        return {
            format: "missing",
            selections: [],
        }
    }

    try {
        const parsed = JSON.parse(rawValue) as unknown

        if (isPersistedRoleSelection(parsed)) {
            return {
                format: "legacy",
                selections: [parsed],
            }
        }

        if (isPersistedRoleSelectionArray(parsed)) {
            return {
                format: "array",
                selections: parsed,
            }
        }

        return {
            format: "invalid",
            selections: [],
        }
    } catch {
        return {
            format: "invalid",
            selections: [],
        }
    }
}

export const SessionProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    const [user, setUser] = useState<User | null>(null)
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [hasStoredCredentials, setHasStoredCredentials] = useState(false)
    const [selectedFrontpageRoleSelections, setSelectedFrontpageRoleSelectionsState] = useState<
        PersistedRoleSelection[]
    >([])
    const [isHydrating, setIsHydrating] = useState(true)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const hydrateUser = async (): Promise<void> => {
            let cachedUser: User | null = null
            let hadStoredCredentials = false
            let loginMarker: { userId: number } | null = null

            try {
                const [credentials, nextCachedUser, nextLoginMarker] = await Promise.all([
                    getSavedCredentials(),
                    getCachedUser(),
                    getSavedLoginMarker(),
                ])
                cachedUser = nextCachedUser
                loginMarker = nextLoginMarker
                hadStoredCredentials = Boolean(credentials.accessToken)
                setHasStoredCredentials(hadStoredCredentials)

                if (!hadStoredCredentials && loginMarker) {
                    await reportSessionLogoutDiagnostic({
                        authErrorCode: null,
                        authErrorMessage: null,
                        authErrorStatus: null,
                        cachedUserId: cachedUser?.id ?? loginMarker.userId,
                        eventName: "credentials_missing_after_login",
                        hadCachedUser: Boolean(cachedUser),
                        hadLoginMarker: true,
                        hadStoredCredentials: false,
                        occurredAt: new Date().toISOString(),
                    })
                    await clearCredentials()
                    await clearCachedUser()
                    await clearLoginMarker()
                    cachedUser = null
                    loginMarker = null
                }

                if (hadStoredCredentials && cachedUser) {
                    setUser(cachedUser)
                    setIsAnonymous(false)
                    setError(null)
                    await removeStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
                }

                if (credentials.accessToken) {
                    const hydratedUser = await getInternkortInformation(credentials.accessToken)
                    setUser(hydratedUser)
                    await Promise.all([
                        saveCachedUser(hydratedUser),
                        saveLoginMarker(hydratedUser.id),
                    ])
                    setIsAnonymous(false)
                    setError(null)
                    await removeStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
                    return
                }

                setUser(null)
                setHasStoredCredentials(false)
                const anonymousFlag = await getStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
                setIsAnonymous(anonymousFlag === "true")
                setError(null)
            } catch (nextError) {
                if (shouldClearCredentialsOnHydrationError(nextError)) {
                    const authError = toAuthServiceError(nextError)
                    await reportSessionLogoutDiagnostic({
                        authErrorCode: authError.code,
                        authErrorMessage: authError.message,
                        authErrorStatus: authError.status ?? null,
                        cachedUserId: cachedUser?.id ?? loginMarker?.userId ?? null,
                        eventName: "session_invalidated",
                        hadCachedUser: Boolean(cachedUser),
                        hadLoginMarker: Boolean(loginMarker),
                        hadStoredCredentials,
                        occurredAt: new Date().toISOString(),
                    })
                    await clearCredentials()
                    await clearDeepLinkToken()
                    await clearCachedUser()
                    await clearLoginMarker()
                    setHasStoredCredentials(false)
                } else if (isTransientAuthError(nextError)) {
                    const cachedUser = await getCachedUser()
                    if (cachedUser) {
                        setUser(cachedUser)
                        setIsAnonymous(false)
                        setError(getHydrationErrorMessage(nextError))
                        await removeStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
                        return
                    }
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
        const hydrateFrontpageRoleSelections = async (): Promise<void> => {
            try {
                if (!user) {
                    setSelectedFrontpageRoleSelectionsState([])
                    return
                }

                const storageKey = getFrontPageRoleStorageKey(user.id)
                const parsedSelections = parsePersistedRoleSelections(
                    await getStoredValue(storageKey),
                )
                const roles = buildDisplayRoles(user)

                if (roles.length === 0) {
                    setSelectedFrontpageRoleSelectionsState([])
                    await removeStoredValue(storageKey)
                    return
                }

                const resolvedPersistedSelections = resolvePersistedRoleSelections(
                    roles,
                    parsedSelections.selections,
                )

                const nextSelections = (() => {
                    switch (parsedSelections.format) {
                        case "array":
                            if (parsedSelections.selections.length === 0) {
                                return []
                            }

                            return resolvedPersistedSelections.length > 0
                                ? resolvedPersistedSelections
                                : resolveDefaultRoleSelections(roles)
                        case "legacy":
                            return resolveDefaultRoleSelections(
                                roles,
                                resolvedPersistedSelections.map(serializeRoleSelection),
                            )
                        case "invalid":
                        case "missing":
                        default:
                            return resolveDefaultRoleSelections(roles)
                    }
                })()

                const nextPersistedSelections = serializeRoleSelections(nextSelections)
                setSelectedFrontpageRoleSelectionsState(nextPersistedSelections)

                if (
                    parsedSelections.format !== "array" ||
                    !arePersistedRoleSelectionsEqual(
                        nextPersistedSelections,
                        parsedSelections.selections,
                    )
                ) {
                    await setStoredValue(storageKey, JSON.stringify(nextPersistedSelections))
                }
            } catch {
                setSelectedFrontpageRoleSelectionsState([])
            }
        }

        void hydrateFrontpageRoleSelections()
    }, [user])

    const setSelectedFrontpageRoleSelections = async (
        selections: PersistedRoleSelection[],
    ): Promise<void> => {
        setSelectedFrontpageRoleSelectionsState(selections)

        try {
            if (!user) {
                return
            }

            const storageKey = getFrontPageRoleStorageKey(user.id)
            await setStoredValue(storageKey, JSON.stringify(selections))
        } catch {
            // Keep in-memory selection even if persistence temporarily fails.
        }
    }

    const loginWithToken = async (email: string, accessToken: string): Promise<AuthResult> => {
        setIsLoading(true)
        setError(null)

        try {
            const session = await createMobileCardSession(email, accessToken)
            await saveCredentials(email, session.sessionToken)
            await Promise.all([saveCachedUser(session.user), saveLoginMarker(session.user.id)])
            setUser(session.user)
            setHasStoredCredentials(true)
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
        await clearCachedUser()
        await clearLoginMarker()
        await removeStoredValue(ANONYMOUS_MODE_STORAGE_KEY)
        setIsAnonymous(false)
        setHasStoredCredentials(false)
        setSelectedFrontpageRoleSelectionsState([])
        setUser(null)
    }

    const value = useMemo(
        () => ({
            user,
            isAnonymous,
            hasStoredCredentials,
            selectedFrontpageRoleSelections,
            isHydrating,
            isLoading,
            error,
            setUser,
            continueAnonymously,
            exitAnonymousMode,
            setSelectedFrontpageRoleSelections,
            loginWithToken,
            logout,
        }),
        [
            continueAnonymously,
            error,
            exitAnonymousMode,
            hasStoredCredentials,
            isAnonymous,
            isHydrating,
            isLoading,
            loginWithToken,
            logout,
            selectedFrontpageRoleSelections,
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
