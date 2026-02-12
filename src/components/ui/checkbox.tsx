import * as CheckboxPrimitive from "@rn-primitives/checkbox"
import { Check } from "lucide-react-native"
import { Platform, type Insets } from "react-native"
import { Icon } from "@/components/ui/icon"
import { type HapticFeedback, runHapticFeedback } from "@/lib/haptics"
import { cn } from "@/lib/utils"

const DEFAULT_HIT_SLOP: Insets = {
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
}

function Checkbox({
    className,
    checkedClassName,
    indicatorClassName,
    iconClassName,
    haptic = "selection",
    checked,
    disabled,
    onCheckedChange,
    hitSlop = DEFAULT_HIT_SLOP,
    ...props
}: CheckboxPrimitive.RootProps &
    React.RefAttributes<CheckboxPrimitive.RootRef> & {
        checkedClassName?: string
        indicatorClassName?: string
        iconClassName?: string
        haptic?: HapticFeedback
    }) {
    return (
        <CheckboxPrimitive.Root
            className={cn(
                "border-input dark:bg-input/30 size-5 shrink-0 rounded-[4px] border shadow-sm shadow-black/5",
                Platform.select({
                    web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive peer cursor-default outline-none transition-shadow focus-visible:ring-[3px] disabled:cursor-not-allowed",
                    native: "overflow-hidden",
                }),
                checked && cn("border-primary", checkedClassName),
                disabled && "opacity-50",
                className,
            )}
            checked={checked}
            disabled={disabled}
            hitSlop={hitSlop}
            onCheckedChange={nextChecked => {
                if (!disabled && haptic !== "none" && nextChecked !== checked) {
                    void runHapticFeedback(haptic)
                }

                onCheckedChange(nextChecked)
            }}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                className={cn(
                    "bg-primary h-full w-full items-center justify-center",
                    indicatorClassName,
                )}
            >
                <Icon
                    as={Check}
                    size={12}
                    strokeWidth={Platform.OS === "web" ? 2.5 : 3.5}
                    className={cn("text-primary-foreground", iconClassName)}
                />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    )
}

export { Checkbox }
