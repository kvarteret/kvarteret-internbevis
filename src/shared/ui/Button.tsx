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
import { cn } from "@/shared/utils/cn"
import { triggerSelectionHaptic, triggerSoftImpactHaptic } from "@/shared/utils/haptics"

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive"
type ButtonHaptic = "selection" | "impactLight"

interface ButtonProps extends React.ComponentProps<typeof Pressable> {
    variant?: ButtonVariant
    haptic?: ButtonHaptic
    androidRipple?: PressableAndroidRippleConfig | null
}

const resolveButtonClassName = (variant: ButtonVariant, disabled?: boolean | null): string =>
    cn(
        "h-12 w-full flex-row items-center justify-center rounded-xl border px-4",
        variant === "default" && "border-text-primary bg-text-primary",
        variant === "secondary" && "border-border bg-surface",
        variant === "ghost" && "border-transparent bg-transparent",
        variant === "destructive" && "border-state-danger bg-state-danger",
        Boolean(disabled) && "bg-surface-muted border-border",
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
    ...props
}: ButtonProps): React.JSX.Element => {
    const resolvedAndroidRipple =
        Platform.OS !== "android" || androidRipple === null
            ? undefined
            : (androidRipple ?? (variant === "ghost" ? undefined : { color: "rgba(0,0,0,0.08)" }))

    const handlePress = (event: GestureResponderEvent): void => {
        if (!disabled) {
            void runHaptic(haptic)
        }

        onPress?.(event)
    }

    return (
        <Pressable
            accessibilityRole={accessibilityRole ?? "button"}
            android_ripple={resolvedAndroidRipple}
            className={cn(resolveButtonClassName(variant, disabled), className)}
            disabled={disabled}
            style={resolvePressableStyle(style)}
            onPress={handlePress}
            {...props}
        />
    )
}
