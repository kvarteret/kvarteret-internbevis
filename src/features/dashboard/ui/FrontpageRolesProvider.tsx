import React, {
    createContext,
    PropsWithChildren,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react"
import { useSession } from "@/app/providers/SessionProvider"
import { getStoredValue, removeStoredValue, setStoredValue } from "@/core/storage/asyncStorage"
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

// Which roles the user pinned to the front-page card is a dashboard UI
// preference, not session state — it lives here instead of SessionProvider.

interface FrontpageRolesContextValue {
    selectedFrontpageRoleSelections: PersistedRoleSelection[]
    setSelectedFrontpageRoleSelections: (selections: PersistedRoleSelection[]) => Promise<void>
}

const FrontpageRolesContext = createContext<FrontpageRolesContextValue | undefined>(undefined)
const FRONT_PAGE_ROLE_STORAGE_KEY_PREFIX = "selected_frontpage_role"

const getFrontPageRoleStorageKey = (userId: number): string =>
    `${FRONT_PAGE_ROLE_STORAGE_KEY_PREFIX}:${userId}`

type ParsedPersistedRoleSelections = {
    format: "array" | "invalid" | "legacy" | "missing"
    selections: PersistedRoleSelection[]
}

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

export const FrontpageRolesProvider = ({ children }: PropsWithChildren): React.JSX.Element => {
    const { user } = useSession()
    const [selectedFrontpageRoleSelections, setSelectedFrontpageRoleSelectionsState] = useState<
        PersistedRoleSelection[]
    >([])

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

    const setSelectedFrontpageRoleSelections = useCallback(
        async (selections: PersistedRoleSelection[]): Promise<void> => {
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
        },
        [user],
    )

    const value = useMemo<FrontpageRolesContextValue>(
        () => ({
            selectedFrontpageRoleSelections,
            setSelectedFrontpageRoleSelections,
        }),
        [selectedFrontpageRoleSelections, setSelectedFrontpageRoleSelections],
    )

    return <FrontpageRolesContext.Provider value={value}>{children}</FrontpageRolesContext.Provider>
}

export const useFrontpageRoles = (): FrontpageRolesContextValue => {
    const context = useContext(FrontpageRolesContext)
    if (!context) {
        throw new Error("useFrontpageRoles must be used within a FrontpageRolesProvider")
    }

    return context
}
