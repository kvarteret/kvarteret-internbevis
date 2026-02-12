import * as RadioGroupPrimitive from "@rn-primitives/radio-group"
import { Platform, type Insets } from "react-native"
import { type HapticFeedback, runHapticFeedback } from "@/lib/haptics"
import { cn } from "@/lib/utils"

const DEFAULT_HIT_SLOP: Insets = {
    top: 12,
    left: 12,
    right: 12,
    bottom: 12,
}

type RadioGroupProps = RadioGroupPrimitive.RootProps &
    React.RefAttributes<RadioGroupPrimitive.RootRef> & {
        haptic?: HapticFeedback
    }

type RadioGroupItemProps = RadioGroupPrimitive.ItemProps &
    React.RefAttributes<RadioGroupPrimitive.ItemRef> & {
        hitSlop?: Insets | number
    }

type RadioGroupIndicatorProps = RadioGroupPrimitive.IndicatorProps &
    React.RefAttributes<RadioGroupPrimitive.IndicatorRef>

function RadioGroup({
    className,
    haptic = "none",
    value,
    onValueChange,
    disabled,
    ...props
}: RadioGroupProps) {
    return (
        <RadioGroupPrimitive.Root
            className={cn("gap-3", className)}
            disabled={disabled}
            value={value}
            onValueChange={nextValue => {
                if (!disabled && haptic !== "none" && nextValue !== value) {
                    void runHapticFeedback(haptic)
                }

                onValueChange(nextValue)
            }}
            {...props}
        />
    )
}

function RadioGroupItem({
    className,
    children,
    hitSlop = DEFAULT_HIT_SLOP,
    ...props
}: RadioGroupItemProps) {
    const itemClassName = props.asChild
        ? className
        : cn(
              "border-input bg-card dark:bg-input/30 aspect-square size-5 shrink-0 items-center justify-center rounded-full border shadow-sm shadow-black/5",
              Platform.select({
                  web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive outline-none transition-all focus-visible:ring-[3px] disabled:cursor-not-allowed",
              }),
              props.disabled && "opacity-50",
              className,
          )

    return (
        <RadioGroupPrimitive.Item
            className={itemClassName}
            hitSlop={hitSlop}
            {...props}
        >
            {children ?? <RadioGroupIndicator />}
        </RadioGroupPrimitive.Item>
    )
}

function RadioGroupIndicator({ className, ...props }: RadioGroupIndicatorProps) {
    return (
        <RadioGroupPrimitive.Indicator
            className={cn("bg-primary size-2.5 rounded-full", className)}
            {...props}
        />
    )
}

export { RadioGroup, RadioGroupIndicator, RadioGroupItem }
