import { BlurView } from "expo-blur"
import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect"
import React from "react"
import { Platform, StyleProp, View, ViewProps, ViewStyle } from "react-native"
import { useBlurTargetRef } from "@/shared/ui/blur/BlurTargetProvider"
import { cn } from "@/shared/utils/cn"

type CardVariant = "grouped" | "elevated"
type CardEffect = "none" | "liquid"

interface CardProps extends ViewProps {
    variant?: CardVariant
    effect?: CardEffect
    className?: string
    style?: StyleProp<ViewStyle>
}

const ABSOLUTE_FILL_STYLE: ViewStyle = {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
}

// Style escape hatch: platform-specific border widths/elevation are not represented by our utility tokens.
const resolveVariantStyle = (variant: CardVariant, effect: CardEffect): ViewStyle => {
    if (Platform.OS === "ios" && effect === "liquid") {
        return {
            borderWidth: 0.75,
        }
    }

    if (Platform.OS === "android" && effect === "liquid") {
        return {
            borderWidth: 0,
            elevation: variant === "elevated" ? 1 : 0,
        }
    }

    if (variant === "elevated") {
        return Platform.OS === "ios"
            ? {
                  borderWidth: 0.5,
              }
            : {
                  borderWidth: 0.5,
                  elevation: 3,
              }
    }

    return Platform.OS === "ios"
        ? {
              borderWidth: 0.5,
          }
        : {
              borderWidth: 0.75,
              elevation: 1,
          }
}

const resolveVariantClassName = (variant: CardVariant, effect: CardEffect): string => {
    const shared = Platform.OS === "ios" ? "rounded-2xl overflow-hidden" : "rounded-card overflow-hidden"

    if (Platform.OS === "ios" && effect === "liquid") {
        return cn(shared, "border-white/45 bg-white/35", variant === "elevated" ? "shadow-card" : null)
    }

    if (Platform.OS === "android" && effect === "liquid") {
        return cn(shared, "border-transparent bg-white/14")
    }

    if (variant === "elevated") {
        return cn(
            shared,
            "border-border bg-surface",
            Platform.OS === "ios" ? "shadow-card" : "border-android-surface-outline bg-android-card-elevated-surface",
        )
    }

    return cn(
        shared,
        "border-border bg-surface",
        Platform.OS === "android" ? "border-android-surface-outline bg-android-card-grouped-surface" : null,
    )
}

export const Card = ({
    variant = "grouped",
    effect = "none",
    className,
    style,
    children,
    ...props
}: CardProps): React.JSX.Element => {
    const blurTargetRef = useBlurTargetRef()
    const useLiquidEffect =
        Platform.OS === "ios" && effect === "liquid" && isGlassEffectAPIAvailable()
    const useAndroidBlurEffect =
        Platform.OS === "android" && effect === "liquid" && Boolean(blurTargetRef)

    return (
        <View
            className={cn(resolveVariantClassName(variant, effect), className)}
            style={[resolveVariantStyle(variant, effect), style]}
            {...props}
        >
            {useAndroidBlurEffect ? (
                <BlurView
                    blurMethod="dimezisBlurViewSdk31Plus"
                    blurTarget={blurTargetRef ?? undefined}
                    intensity={85}
                    pointerEvents="none"
                    // Style escape hatch: Expo Blur still requires a native style object here.
                    style={ABSOLUTE_FILL_STYLE}
                    tint="light"
                />
            ) : null}
            {useLiquidEffect ? (
                <GlassView
                    colorScheme="light"
                    glassEffectStyle="regular"
                    pointerEvents="none"
                    // Style escape hatch: Expo Glass currently positions this overlay via style prop.
                    style={ABSOLUTE_FILL_STYLE}
                />
            ) : null}
            {children}
        </View>
    )
}
