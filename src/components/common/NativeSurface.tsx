import { BlurView } from "expo-blur"
import React from "react"
import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native"
import { platformUi } from "../../constants/platformUi"
import { cn } from "../../utils/cn"

type NativeSurfaceVariant = "grouped" | "elevated"
type NativeSurfaceEffect = "none" | "liquid"

interface NativeSurfaceProps extends ViewProps {
    variant?: NativeSurfaceVariant
    nativeEffect?: NativeSurfaceEffect
    className?: string
    style?: StyleProp<ViewStyle>
}

const styles = StyleSheet.create({
    base: {
        borderRadius: platformUi.surfaceRadius,
        overflow: "hidden",
    },
    groupedIOS: {
        borderColor: "#D1D5DB",
        borderWidth: platformUi.surfaceBorderWidth,
        backgroundColor: "#FFFFFF",
    },
    groupedLiquidIOS: {
        borderColor: "rgba(255,255,255,0.45)",
        borderWidth: 0.75,
        backgroundColor: "rgba(255,255,255,0.34)",
    },
    groupedAndroid: {
        borderColor: "#D1D5DB",
        borderWidth: platformUi.surfaceBorderWidth,
        backgroundColor: "#FAFAFA",
        elevation: 1,
    },
    elevatedIOS: {
        borderColor: "#D1D5DB",
        borderWidth: platformUi.surfaceBorderWidth,
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
        borderWidth: platformUi.surfaceBorderWidth,
        backgroundColor: "#FAFAFA",
        elevation: 2,
    },
    blurFill: {
        ...StyleSheet.absoluteFillObject,
    },
})

function resolveVariantStyle(
    variant: NativeSurfaceVariant,
    nativeEffect: NativeSurfaceEffect,
): ViewStyle {
    if (Platform.OS === "ios" && nativeEffect === "liquid") {
        return variant === "elevated" ? styles.elevatedLiquidIOS : styles.groupedLiquidIOS
    }

    if (variant === "elevated") {
        return Platform.OS === "ios" ? styles.elevatedIOS : styles.elevatedAndroid
    }

    return Platform.OS === "ios" ? styles.groupedIOS : styles.groupedAndroid
}

export function NativeSurface({
    variant = "grouped",
    nativeEffect = "none",
    className,
    style,
    children,
    ...props
}: NativeSurfaceProps): React.JSX.Element {
    const useLiquidEffect = Platform.OS === "ios" && nativeEffect === "liquid"

    return (
        <View
            className={cn(nativeEffect === "liquid" ? null : "bg-surface", className)}
            style={[styles.base, resolveVariantStyle(variant, nativeEffect), style]}
            {...props}
        >
            {useLiquidEffect ? (
                <BlurView intensity={32} style={styles.blurFill} tint="light" />
            ) : null}
            {children}
        </View>
    )
}
