import React from "react"
import { Text, View } from "react-native"
import { cn } from "../../utils/cn"

interface LabeledValueRowProps {
    label: string
    value: string
    className?: string
}

export function LabeledValueRow({
    label,
    value,
    className,
}: LabeledValueRowProps): React.JSX.Element {
    return (
        <View className={cn("mt-1 flex-row flex-wrap", className)}>
            <Text className="font-inter-medium text-sm text-text-secondary">{label}: </Text>
            <Text className="font-inter text-sm text-text-secondary">{value}</Text>
        </View>
    )
}
