import { cva, type VariantProps } from "class-variance-authority"
import {
    Platform,
    Pressable,
    type GestureResponderEvent,
    type Insets,
    type PressableAndroidRippleConfig,
    type PressableStateCallbackType,
    type StyleProp,
    type ViewStyle,
} from "react-native"
import { TextClassContext } from "@/components/ui/text"
import { type HapticFeedback, runHapticFeedback } from "@/lib/haptics"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
    cn(
        "group shrink-0 flex-row items-center justify-center gap-2 rounded-md shadow-none",
        Platform.select({
            web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        }),
    ),
    {
        variants: {
            variant: {
                default: cn(
                    "bg-primary active:bg-primary/90 shadow-sm shadow-black/5",
                    Platform.select({ web: "hover:bg-primary/90" }),
                ),
                destructive: cn(
                    "bg-destructive active:bg-destructive/90 dark:bg-destructive/60 shadow-sm shadow-black/5",
                    Platform.select({
                        web: "hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
                    }),
                ),
                outline: cn(
                    "border-border bg-background active:bg-accent dark:bg-input/30 dark:border-input dark:active:bg-input/50 border shadow-sm shadow-black/5",
                    Platform.select({
                        web: "hover:bg-accent dark:hover:bg-input/50",
                    }),
                ),
                secondary: cn(
                    "bg-secondary active:bg-secondary/80 shadow-sm shadow-black/5",
                    Platform.select({ web: "hover:bg-secondary/80" }),
                ),
                ghost: cn(
                    "active:bg-accent dark:active:bg-accent/50",
                    Platform.select({ web: "hover:bg-accent dark:hover:bg-accent/50" }),
                ),
                link: "",
            },
            size: {
                default: cn("h-10 px-4 py-2 sm:h-9", Platform.select({ web: "has-[>svg]:px-3" })),
                sm: cn(
                    "h-9 gap-1.5 rounded-md px-3 sm:h-8",
                    Platform.select({ web: "has-[>svg]:px-2.5" }),
                ),
                lg: cn("h-11 rounded-md px-6 sm:h-10", Platform.select({ web: "has-[>svg]:px-4" })),
                icon: "h-10 w-10 sm:h-9 sm:w-9",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
)

const buttonTextVariants = cva(
    cn(
        "text-foreground text-sm font-medium",
        Platform.select({ web: "pointer-events-none transition-colors" }),
    ),
    {
        variants: {
            variant: {
                default: "text-primary-foreground",
                destructive: "text-white",
                outline: cn(
                    "group-active:text-accent-foreground",
                    Platform.select({ web: "group-hover:text-accent-foreground" }),
                ),
                secondary: "text-secondary-foreground",
                ghost: "group-active:text-accent-foreground",
                link: cn(
                    "text-primary group-active:underline",
                    Platform.select({
                        web: "underline-offset-4 hover:underline group-hover:underline",
                    }),
                ),
            },
            size: {
                default: "",
                sm: "",
                lg: "",
                icon: "",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
)

type ButtonProps = React.ComponentProps<typeof Pressable> &
    React.RefAttributes<typeof Pressable> &
    VariantProps<typeof buttonVariants> & {
        nativeFeedback?: "opacity" | "scale" | "none"
        haptic?: HapticFeedback
        androidRipple?: PressableAndroidRippleConfig | null
    }

const DEFAULT_PRESS_RETENTION_OFFSET: Insets = {
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
}

const DEFAULT_ANDROID_RIPPLE: PressableAndroidRippleConfig = {
    color: "rgba(17, 24, 39, 0.12)",
    borderless: false,
}

function getNativeFeedbackStyle(
    mode: ButtonProps["nativeFeedback"],
    pressed: boolean,
): StyleProp<ViewStyle> {
    if (!pressed) {
        return null
    }

    if (mode === "scale") {
        return {
            opacity: 0.94,
            transform: [{ scale: 0.98 }],
        }
    }

    if (mode === "none") {
        return null
    }

    return { opacity: 0.82 }
}

function resolvePressableStyle(
    style: ButtonProps["style"],
    mode: ButtonProps["nativeFeedback"],
): ((
    state: PressableStateCallbackType,
) => StyleProp<ViewStyle>) {
    return (state: PressableStateCallbackType) => {
        const feedbackStyle = getNativeFeedbackStyle(mode, state.pressed)
        const incomingStyle = typeof style === "function" ? style(state) : style

        return [feedbackStyle, incomingStyle]
    }
}

function Button({
    className,
    variant,
    size,
    nativeFeedback = "opacity",
    haptic = "impactLight",
    androidRipple,
    onPress,
    pressRetentionOffset = DEFAULT_PRESS_RETENTION_OFFSET,
    accessibilityRole,
    style,
    disabled,
    ...props
}: ButtonProps) {
    const resolvedAndroidRipple =
        Platform.OS !== "android" || androidRipple === null
            ? undefined
            : androidRipple ?? (variant === "link" ? undefined : DEFAULT_ANDROID_RIPPLE)

    const pressableStyle = resolvePressableStyle(style, nativeFeedback)

    const handlePress = (event: GestureResponderEvent): void => {
        if (!disabled && haptic !== "none") {
            void runHapticFeedback(haptic)
        }

        onPress?.(event)
    }

    return (
        <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
            <Pressable
                className={cn(
                    disabled && "opacity-50",
                    buttonVariants({ variant, size }),
                    className,
                )}
                accessibilityRole={accessibilityRole ?? "button"}
                android_ripple={resolvedAndroidRipple}
                disabled={disabled}
                pressRetentionOffset={pressRetentionOffset}
                style={pressableStyle}
                onPress={handlePress}
                {...props}
            />
        </TextClassContext.Provider>
    )
}

export { Button, buttonTextVariants, buttonVariants }
export type { ButtonProps }
