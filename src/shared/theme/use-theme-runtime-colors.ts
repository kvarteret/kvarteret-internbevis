import { useMemo } from "react"
import { useCSSVariable } from "uniwind"

const fallbackColors = {
    background: "#F3E2CC",
    brandPrimary: "#F54B4B",
    surface: "#FFFFFF",
    surfaceMuted: "#FAFAFA",
    textPrimary: "#000000",
    textSecondary: "#4B5563",
    tabActive: "#7F2E2E",
    link: "#2563EB",
    editorialInk: "#111827",
    editorialValid: "#2F5E3D",
    stateDanger: "#AA0000",
    androidHeaderSurface: "#F6ECDC",
    androidCardGroupedSurface: "#F8EAD8",
    androidCardElevatedSurface: "#FFF4E7",
    androidSurfaceOutline: "#0000001F",
    androidActionSurface: "#FFFFFFCC",
} as const

const toColorString = (value: string | number | undefined, fallback: string): string =>
    typeof value === "string" ? value : fallback

export const useThemeRuntimeColors = () => {
    const [
        background,
        brandPrimary,
        surface,
        surfaceMuted,
        textPrimary,
        textSecondary,
        tabActive,
        link,
        editorialInk,
        editorialValid,
        stateDanger,
        androidHeaderSurface,
        androidCardGroupedSurface,
        androidCardElevatedSurface,
        androidSurfaceOutline,
        androidActionSurface,
    ] = useCSSVariable([
        "--color-background",
        "--color-brand-primary",
        "--color-surface",
        "--color-surface-muted",
        "--color-text-primary",
        "--color-text-secondary",
        "--color-tab-active",
        "--color-link",
        "--color-editorial-ink",
        "--color-editorial-valid",
        "--color-state-danger",
        "--color-android-header-surface",
        "--color-android-card-grouped-surface",
        "--color-android-card-elevated-surface",
        "--color-android-surface-outline",
        "--color-android-action-surface",
    ])

    return useMemo(
        () => ({
            background: toColorString(background, fallbackColors.background),
            brandPrimary: toColorString(brandPrimary, fallbackColors.brandPrimary),
            surface: toColorString(surface, fallbackColors.surface),
            surfaceMuted: toColorString(surfaceMuted, fallbackColors.surfaceMuted),
            textPrimary: toColorString(textPrimary, fallbackColors.textPrimary),
            textSecondary: toColorString(textSecondary, fallbackColors.textSecondary),
            tabActive: toColorString(tabActive, fallbackColors.tabActive),
            link: toColorString(link, fallbackColors.link),
            editorialInk: toColorString(editorialInk, fallbackColors.editorialInk),
            editorialValid: toColorString(editorialValid, fallbackColors.editorialValid),
            stateDanger: toColorString(stateDanger, fallbackColors.stateDanger),
            androidHeaderSurface: toColorString(
                androidHeaderSurface,
                fallbackColors.androidHeaderSurface,
            ),
            androidCardGroupedSurface: toColorString(
                androidCardGroupedSurface,
                fallbackColors.androidCardGroupedSurface,
            ),
            androidCardElevatedSurface: toColorString(
                androidCardElevatedSurface,
                fallbackColors.androidCardElevatedSurface,
            ),
            androidSurfaceOutline: toColorString(
                androidSurfaceOutline,
                fallbackColors.androidSurfaceOutline,
            ),
            androidActionSurface: toColorString(
                androidActionSurface,
                fallbackColors.androidActionSurface,
            ),
        }),
        [
            androidActionSurface,
            androidCardElevatedSurface,
            androidCardGroupedSurface,
            androidHeaderSurface,
            androidSurfaceOutline,
            background,
            brandPrimary,
            editorialInk,
            editorialValid,
            link,
            stateDanger,
            surface,
            surfaceMuted,
            textPrimary,
            textSecondary,
            tabActive,
        ],
    )
}
