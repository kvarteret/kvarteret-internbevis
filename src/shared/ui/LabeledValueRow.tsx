import React from "react"
import { View } from "react-native"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

interface LabeledValueRowProps {
    label: string
    value: string
    className?: string
}

export const LabeledValueRow = ({
    label,
    value,
    className,
}: LabeledValueRowProps): React.JSX.Element => {
    return (
        <View className={cn("mt-1 flex-row flex-wrap", className)}>
            <Text className="text-sm text-text-secondary">{label}: </Text>
            <Text className="text-sm text-text-secondary">{value}</Text>
        </View>
    )
}
