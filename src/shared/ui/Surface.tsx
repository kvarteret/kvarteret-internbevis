import { BlurView } from "expo-blur"
import React from "react"
import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native"
import { cn } from "@/shared/utils/cn"

type SurfaceVariant = "grouped" | "elevated"
type SurfaceEffect = "none" | "liquid"

interface SurfaceProps extends ViewProps {
    variant?: SurfaceVariant
    effect?: SurfaceEffect
    className?: string
    style?: StyleProp<ViewStyle>
}

const SURFACE_RADIUS = Platform.OS === "ios" ? 16 : 14
const SURFACE_BORDER_WIDTH = Platform.OS === "ios" ? 0.5 : 1

const styles = StyleSheet.create({
    base: {
        borderRadius: SURFACE_RADIUS,
        overflow: "hidden",
    },
    groupedIOS: {
        borderColor: "#D1D5DB",
        borderWidth: SURFACE_BORDER_WIDTH,
        backgroundColor: "#FFFFFF",
    },
    groupedLiquidIOS: {
        borderColor: "rgba(255,255,255,0.45)",
        borderWidth: 0.75,
        backgroundColor: "rgba(255,255,255,0.34)",
    },
    groupedAndroid: {
        borderColor: "#D1D5DB",
        borderWidth: SURFACE_BORDER_WIDTH,
        backgroundColor: "#FAFAFA",
        elevation: 1,
    },
    elevatedIOS: {
        borderColor: "#D1D5DB",
        borderWidth: SURFACE_BORDER_WIDTH,
        backgroundColor: "#FFFFFF",
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
        borderColor: "#D1D5DB",
        borderWidth: SURFACE_BORDER_WIDTH,
        backgroundColor: "#FAFAFA",
        elevation: 2,
    },
    blurFill: {
        ...StyleSheet.absoluteFillObject,
    },
})

const resolveVariantStyle = (variant: SurfaceVariant, effect: SurfaceEffect): ViewStyle => {
    if (Platform.OS === "ios" && effect === "liquid") {
        return variant === "elevated" ? styles.elevatedLiquidIOS : styles.groupedLiquidIOS
    }

    if (variant === "elevated") {
        return Platform.OS === "ios" ? styles.elevatedIOS : styles.elevatedAndroid
    }

    return Platform.OS === "ios" ? styles.groupedIOS : styles.groupedAndroid
}

export const Surface = ({
    variant = "grouped",
    effect = "none",
    className,
    style,
    children,
    ...props
}: SurfaceProps): React.JSX.Element => {
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

interface StateSurfaceProps extends SurfaceProps {}

export const StateSurface = ({
    className,
    style,
    children,
    variant = "grouped",
    ...props
}: StateSurfaceProps): React.JSX.Element => {
    return (
        <Surface className={cn("gap-3 p-4", className)} style={style} variant={variant} {...props}>
            {children}
        </Surface>
    )
}
