import React from "react"
import { Pressable } from "react-native"
import { Text } from "@/shared/ui/Text"

interface FilterChipProps {
    label: string
    selected: boolean
    onPress: () => void
    variant?: "filled" | "outlined"
}

export const FilterChip = ({
    label,
    selected,
    onPress,
    variant = "filled",
}: FilterChipProps): React.JSX.Element => (
    <Pressable
        accessibilityRole="button"
        accessibilityState={{ selected }}
        className={`h-12 items-center justify-center rounded-none px-5 ${
            variant === "outlined" ? "border-2 border-editorial-ink" : ""
        } ${selected ? "bg-editorial-ink" : "bg-surface-muted"}`}
        onPress={onPress}
    >
        <Text
            className={`text-base font-extrabold ${
                selected ? "text-editorial-surface" : "text-editorial-ink"
            }`}
        >
            {label}
        </Text>
    </Pressable>
)
