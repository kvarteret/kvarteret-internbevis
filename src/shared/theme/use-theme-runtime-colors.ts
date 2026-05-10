import "../../../global.css"
import { useMemo } from "react"
import { useCSSVariable } from "uniwind"

const runtimeColorVariables = [
    ["background", "--color-background"],
    ["brandPrimary", "--color-brand-primary"],
    ["surface", "--color-surface"],
    ["surfaceMuted", "--color-surface-muted"],
    ["textPrimary", "--color-text-primary"],
    ["textSecondary", "--color-text-secondary"],
    ["tabActive", "--color-tab-active"],
    ["link", "--color-link"],
    ["editorialInk", "--color-editorial-ink"],
    ["editorialValid", "--color-editorial-valid"],
    ["stateDanger", "--color-state-danger"],
    ["androidHeaderSurface", "--color-android-header-surface"],
    ["androidCardGroupedSurface", "--color-android-card-grouped-surface"],
    ["androidCardElevatedSurface", "--color-android-card-elevated-surface"],
    ["androidSurfaceOutline", "--color-android-surface-outline"],
    ["androidActionSurface", "--color-android-action-surface"],
] as const

type RuntimeThemeColorKey = (typeof runtimeColorVariables)[number][0]

const requireColorVariable = (variableName: string, value: string | number | undefined): string => {
    if (typeof value === "string") {
        return value
    }

    throw new Error(
        `Missing required theme variable ${variableName}. Ensure global.css is loaded before rendering runtime theme consumers.`,
    )
}

export const useThemeRuntimeColors = () => {
    const resolvedVariableValues = useCSSVariable(
        runtimeColorVariables.map(([, variable]) => variable),
    )

    return useMemo(
        () =>
            runtimeColorVariables.reduce<Record<RuntimeThemeColorKey, string>>(
                (accumulator, [key, variableName], index) => {
                    accumulator[key] = requireColorVariable(
                        variableName,
                        resolvedVariableValues[index],
                    )
                    return accumulator
                },
                {} as Record<RuntimeThemeColorKey, string>,
            ),
        [resolvedVariableValues],
    )
}
