import { BlurView } from "expo-blur"
import React from "react"
import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native"
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
const TOKEN_BORDER = "#D1D5DB" // border
const TOKEN_SURFACE = "#FFFFFF" // surface
const TOKEN_SURFACE_MUTED = "#FAFAFA" // surface-muted (near-white for Android)

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
        borderColor: TOKEN_BORDER,
        borderWidth: CARD_BORDER_WIDTH,
        backgroundColor: TOKEN_SURFACE_MUTED,
        elevation: 1,
    },
    elevatedIOS: {
        borderColor: TOKEN_BORDER,
        borderWidth: CARD_BORDER_WIDTH,
        backgroundColor: TOKEN_SURFACE,
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    elevatedLiquidIOS: {
        borderColor: "rgba(255,255,255,0.45)",
        borderWidth: 0.75,
        backgroundColor: "rgba(255,255,255,0.34)",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    elevatedAndroid: {
        borderColor: TOKEN_BORDER,
        borderWidth: CARD_BORDER_WIDTH,
        backgroundColor: TOKEN_SURFACE_MUTED,
        elevation: 2,
    },
    blurFill: {
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
    const useLiquidEffect = Platform.OS === "ios" && effect === "liquid"

    return (
        <View
            className={cn(effect === "liquid" ? null : "bg-surface", className)}
            style={[styles.base, resolveVariantStyle(variant, effect), style]}
            {...props}
        >
            {useLiquidEffect ? (
                <BlurView intensity={32} style={styles.blurFill} tint="light" />
            ) : null}
            {children}
        </View>
    )
}
