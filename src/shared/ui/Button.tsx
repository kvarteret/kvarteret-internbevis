import React from "react"
import {
    GestureResponderEvent,
    Platform,
    Pressable,
    PressableAndroidRippleConfig,
    PressableStateCallbackType,
    StyleProp,
    ViewStyle,
} from "react-native"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"
import { triggerSelectionHaptic, triggerSoftImpactHaptic } from "@/shared/utils/haptics"

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive"
type ButtonHaptic = "selection" | "impactLight"

interface ButtonProps extends Omit<React.ComponentProps<typeof Pressable>, "children"> {
    children?: React.ReactNode
    variant?: ButtonVariant
    haptic?: ButtonHaptic
    androidRipple?: PressableAndroidRippleConfig | null
}

const resolveGhostClassName = (disabled?: boolean | null): string =>
    cn(
        "h-12 w-full flex-row items-center justify-center rounded-xl px-4",
        "bg-transparent",
        Boolean(disabled) && "bg-surface-muted opacity-70",
    )

const resolveButtonClassName = (variant: ButtonVariant, disabled?: boolean | null): string =>
    cn(
        "h-12 w-full flex-row items-center justify-center rounded-xl px-4",
        variant === "default" && "bg-text-primary",
        variant === "secondary" && "bg-surface-muted ios:bg-surface/70",
        variant === "destructive" && "bg-state-danger",
        Boolean(disabled) && "bg-surface-muted opacity-70",
    )

const resolveTextClassName = (variant: ButtonVariant): string =>
    cn(
        "text-base leading-5 font-semibold",
        variant === "default" || variant === "destructive" ? "text-surface" : "text-text-primary",
    )

const resolvePressableStyle = (
    style: ButtonProps["style"],
): ((state: PressableStateCallbackType) => StyleProp<ViewStyle>) => {
    return state => {
        const incomingStyle = typeof style === "function" ? style(state) : style
        const pressedStyle = state.pressed
            ? {
                  transform: [{ scale: 0.985 }],
              }
            : null

        return [pressedStyle, incomingStyle]
    }
}

const runHaptic = async (mode: ButtonHaptic): Promise<void> => {
    if (mode === "selection") {
        await triggerSelectionHaptic()
        return
    }

    await triggerSoftImpactHaptic()
}

export const Button = ({
    variant = "default",
    haptic = "impactLight",
    androidRipple,
    className,
    onPress,
    disabled,
    style,
    accessibilityRole,
    children,
    ...props
}: ButtonProps): React.JSX.Element => {
    const isGhost = variant === "ghost"

    const resolvedAndroidRipple =
        Platform.OS !== "android" || androidRipple === null
            ? undefined
            : (androidRipple ??
              (variant === "default" || variant === "destructive"
                  ? { color: "rgba(255,255,255,0.18)" }
                  : { color: "rgba(0,0,0,0.08)" }))

    const handlePress = (event: GestureResponderEvent): void => {
        if (!disabled) {
            void runHaptic(haptic)
        }

        onPress?.(event)
    }

    const normalizedChildren =
        typeof children === "string" || typeof children === "number" ? (
            <Text className={resolveTextClassName(variant)}>{children}</Text>
        ) : (
            children
        )

    return (
        <Pressable
            accessibilityRole={accessibilityRole ?? "button"}
            android_ripple={resolvedAndroidRipple}
            className={cn(
                isGhost ? resolveGhostClassName(disabled) : resolveButtonClassName(variant, disabled),
                className,
            )}
            disabled={disabled}
            style={resolvePressableStyle(style)}
            onPress={handlePress}
            {...props}
        >
            {normalizedChildren}
        </Pressable>
    )
}
