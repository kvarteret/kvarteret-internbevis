import React from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

interface LabeledValueRowProps {
    label: string
    value: string
    className?: string
    style?: StyleProp<ViewStyle>
}

export const LabeledValueRow = ({
    label,
    value,
    className,
    style,
}: LabeledValueRowProps): React.JSX.Element => {
    return (
        <View className={cn("mt-1 flex-row flex-wrap", className)} style={style}>
            <Text className="text-sm text-text-secondary">{label}: </Text>
            <Text className="text-sm text-text-secondary">{value}</Text>
        </View>
    )
}
