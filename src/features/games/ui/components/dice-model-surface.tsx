import React from "react"
import { View } from "react-native"
import { DiceType } from "@/features/games/domain/dice"
import { Text } from "@/shared/ui/Text"

interface DiceModelSurfaceProps {
    diceType: DiceType
    isRolling: boolean
    rollToken: number
    value: number
}

export const DiceModelSurface = ({
    diceType,
    isRolling,
    rollToken: _rollToken,
    value,
}: DiceModelSurfaceProps): React.JSX.Element => {
    return (
        <View className="items-center justify-center rounded-[28px] bg-[#05070c] px-6 py-12">
            <Text className="text-[88px] font-bold text-[#f5f8ff]">{isRolling ? "…" : value}</Text>
            <Text className="pt-2 text-base font-semibold text-white/55">{`d${diceType}`}</Text>
        </View>
    )
}
