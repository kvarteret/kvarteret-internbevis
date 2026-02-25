import React from "react"
import {
    GestureResponderEvent,
    Platform,
    Pressable,
    PressableAndroidRippleConfig,
    PressableStateCallbackType,
    StyleProp,
    TextStyle,
    ViewStyle,
    View,
} from "react-native"
import { Button as PaperButton } from "react-native-paper"
import { themeColors } from "@/shared/theme/colors"
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

const resolveAndroidPaperMode = (variant: ButtonVariant): "text" | "contained" | "contained-tonal" => {
    if (variant === "secondary") return "contained-tonal"
    if (variant === "ghost") return "text"
    return "contained"
}

const resolveAndroidPaperButtonColor = (variant: ButtonVariant): string | undefined => {
    if (variant === "default") return themeColors.editorialInk
    if (variant === "destructive") return themeColors.stateDanger
    if (variant === "secondary") return themeColors.androidCardGroupedSurface
    return undefined
}

const resolveAndroidPaperTextColor = (variant: ButtonVariant): string => {
    if (variant === "default" || variant === "destructive") return themeColors.surface
    return themeColors.editorialInk
}

const resolveAndroidPaperStyle = (
    variant: ButtonVariant,
    disabled: boolean,
    style: ButtonProps["style"],
): StyleProp<ViewStyle> => {
    const disabledGhostStyle =
        variant === "ghost" && disabled
            ? {
                  backgroundColor: themeColors.surfaceMuted,
                  opacity: 0.7,
              }
            : null

    return [
        {
            width: "100%",
            borderRadius: 12,
        },
        disabledGhostStyle,
        toStaticStyle(style),
    ]
}

const toStaticStyle = (style: ButtonProps["style"]): StyleProp<ViewStyle> =>
    typeof style === "function"
        ? (style({
              pressed: false,
          }) as StyleProp<ViewStyle>)
        : style

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
    accessibilityHint,
    accessibilityLabel,
    accessibilityState,
    accessibilityValue,
    testID,
    onLongPress,
    onPressIn,
    onPressOut,
    delayLongPress,
    children,
    ...props
}: ButtonProps): React.JSX.Element => {
    const isAndroid = Platform.OS === "android"
    const isGhost = variant === "ghost"
    const isDisabled = Boolean(disabled)

    const resolvedAndroidRipple =
        !isAndroid || androidRipple === null
            ? undefined
            : (androidRipple ??
              (variant === "default" || variant === "destructive"
                  ? { color: "rgba(255,255,255,0.18)" }
                  : { color: "rgba(0,0,0,0.08)" }))

    const handlePress = (event: GestureResponderEvent): void => {
        if (!isDisabled) {
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

    if (isAndroid) {
        const rippleColor =
            typeof resolvedAndroidRipple === "object" && resolvedAndroidRipple?.color
                ? String(resolvedAndroidRipple.color)
                : undefined
        const labelStyle: TextStyle = {
            fontSize: 16,
            lineHeight: 20,
            fontWeight: "600",
        }

        return (
            <View className={cn("w-full", className)}>
                <PaperButton
                    accessibilityHint={accessibilityHint}
                    accessibilityLabel={accessibilityLabel}
                    accessibilityRole={accessibilityRole ?? "button"}
                    accessibilityState={accessibilityState}
                    accessibilityValue={accessibilityValue}
                    buttonColor={resolveAndroidPaperButtonColor(variant)}
                    contentStyle={{ minHeight: 48 }}
                    delayLongPress={delayLongPress ?? undefined}
                    disabled={isDisabled}
                    mode={resolveAndroidPaperMode(variant)}
                    rippleColor={rippleColor}
                    style={resolveAndroidPaperStyle(variant, isDisabled, style)}
                    textColor={resolveAndroidPaperTextColor(variant)}
                    labelStyle={labelStyle}
                    testID={testID}
                    onLongPress={onLongPress ?? undefined}
                    onPress={handlePress}
                    onPressIn={onPressIn ?? undefined}
                    onPressOut={onPressOut ?? undefined}
                >
                    {normalizedChildren}
                </PaperButton>
            </View>
        )
    }

    return (
        <Pressable
            accessibilityRole={accessibilityRole ?? "button"}
            android_ripple={resolvedAndroidRipple}
            className={cn(
                isGhost
                    ? resolveGhostClassName(isDisabled)
                    : resolveButtonClassName(variant, isDisabled),
                className,
            )}
            disabled={isDisabled}
            style={resolvePressableStyle(style)}
            accessibilityHint={accessibilityHint}
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            accessibilityValue={accessibilityValue}
            delayLongPress={delayLongPress}
            testID={testID}
            onLongPress={onLongPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={handlePress}
            {...props}
        >
            {normalizedChildren}
        </Pressable>
    )
}
