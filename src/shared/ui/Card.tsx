import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect"
import React from "react"
import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native"
import { themeColors } from "@/shared/theme/colors"
import { cn } from "@/shared/utils/cn"

type CardVariant = "grouped" | "elevated"
type CardEffect = "none" | "liquid"

interface CardProps extends ViewProps {
    variant?: CardVariant
    effect?: CardEffect
    className?: string
    style?: StyleProp<ViewStyle>
}

// Design token references (must match tailwind.config.js)
const TOKEN_BORDER = themeColors.border // border
const TOKEN_SURFACE = themeColors.surface // surface
const TOKEN_ANDROID_OUTLINE = themeColors.androidSurfaceOutline
const TOKEN_ANDROID_GROUPED_SURFACE = themeColors.androidCardGroupedSurface
const TOKEN_ANDROID_ELEVATED_SURFACE = themeColors.androidCardElevatedSurface

const CARD_RADIUS = Platform.OS === "ios" ? 16 : 14
const CARD_BORDER_WIDTH = Platform.OS === "ios" ? 0.5 : 1

const styles = StyleSheet.create({
    base: {
        borderRadius: CARD_RADIUS,
        overflow: "hidden",
    },
    groupedIOS: {
        borderColor: TOKEN_BORDER,
        borderWidth: CARD_BORDER_WIDTH,
        backgroundColor: TOKEN_SURFACE,
    },
    groupedLiquidIOS: {
        borderColor: "rgba(255,255,255,0.45)",
        borderWidth: 0.75,
        backgroundColor: "rgba(255,255,255,0.34)",
    },
    groupedAndroid: {
        borderColor: TOKEN_ANDROID_OUTLINE,
        borderWidth: 0.75,
        backgroundColor: TOKEN_ANDROID_GROUPED_SURFACE,
        elevation: 1,
    },
    elevatedIOS: {
        borderColor: TOKEN_BORDER,
        borderWidth: CARD_BORDER_WIDTH,
        backgroundColor: TOKEN_SURFACE,
        shadowColor: themeColors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    elevatedLiquidIOS: {
        borderColor: "rgba(255,255,255,0.45)",
        borderWidth: 0.75,
        backgroundColor: "rgba(255,255,255,0.34)",
        shadowColor: themeColors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    elevatedAndroid: {
        borderColor: TOKEN_ANDROID_OUTLINE,
        borderWidth: 0.5,
        backgroundColor: TOKEN_ANDROID_ELEVATED_SURFACE,
        elevation: 3,
    },
    glassFill: {
        ...StyleSheet.absoluteFillObject,
    },
})

const resolveVariantStyle = (variant: CardVariant, effect: CardEffect): ViewStyle => {
    if (Platform.OS === "ios" && effect === "liquid") {
        return variant === "elevated" ? styles.elevatedLiquidIOS : styles.groupedLiquidIOS
    }

    if (variant === "elevated") {
        return Platform.OS === "ios" ? styles.elevatedIOS : styles.elevatedAndroid
    }

    return Platform.OS === "ios" ? styles.groupedIOS : styles.groupedAndroid
}

export const Card = ({
    variant = "grouped",
    effect = "none",
    className,
    style,
    children,
    ...props
}: CardProps): React.JSX.Element => {
    const useLiquidEffect =
        Platform.OS === "ios" && effect === "liquid" && isGlassEffectAPIAvailable()

    return (
        <View
            className={cn(className)}
            style={[styles.base, resolveVariantStyle(variant, effect), style]}
            {...props}
        >
            {useLiquidEffect ? (
                <GlassView
                    colorScheme="light"
                    glassEffectStyle="regular"
                    pointerEvents="none"
                    style={styles.glassFill}
                />
            ) : null}
            {children}
        </View>
    )
}
