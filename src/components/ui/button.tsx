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
import { cn } from "../../utils/cn"
import { triggerSelectionHaptic, triggerSoftImpactHaptic } from "../../utils/haptics"

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive"
type ButtonHaptic = "none" | "selection" | "impactLight"

interface ButtonProps extends React.ComponentProps<typeof Pressable> {
    variant?: ButtonVariant
    haptic?: ButtonHaptic
    androidRipple?: PressableAndroidRippleConfig | null
}

function resolveButtonClassName(variant: ButtonVariant, disabled?: boolean | null): string {
    return cn(
        "h-12 w-full flex-row items-center justify-center rounded-xl border px-4",
        variant === "default" && "border-text-primary bg-text-primary",
        variant === "secondary" && "border-border bg-surface",
        variant === "ghost" && "border-transparent bg-transparent",
        variant === "destructive" && "border-danger bg-danger",
        Boolean(disabled) && "opacity-60",
    )
}

function resolvePressableStyle(
    style: ButtonProps["style"],
): (state: PressableStateCallbackType) => StyleProp<ViewStyle> {
    return state => {
        const incomingStyle = typeof style === "function" ? style(state) : style
        const pressedStyle =
            Platform.OS === "ios" && state.pressed
                ? {
                      opacity: 0.82,
                      transform: [{ scale: 0.99 }],
                  }
                : null

        return [pressedStyle, incomingStyle]
    }
}

async function runHaptic(mode: ButtonHaptic): Promise<void> {
    if (mode === "none") {
        return
    }

    if (mode === "selection") {
        await triggerSelectionHaptic()
        return
    }

    await triggerSoftImpactHaptic()
}

export function Button({
    variant = "default",
    haptic = "impactLight",
    androidRipple,
    className,
    onPress,
    disabled,
    style,
    accessibilityRole,
    ...props
}: ButtonProps): React.JSX.Element {
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
