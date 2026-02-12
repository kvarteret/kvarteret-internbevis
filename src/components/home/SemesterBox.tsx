import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"
import { Text } from "@/components/ui/text"
import { cn } from "../../utils/cn"

interface SemesterBoxProps {
    status: string
    semester: string
    isValid: boolean
    tier: number
    onPress: () => void
}

function getTierIconName(tier: number): keyof typeof MaterialIcons.glyphMap {
    switch (tier) {
        case 1:
            return "school"
        case 2:
            return "groups"
        case 3:
            return "home"
        case 4:
            return "business"
        default:
            return "person"
    }
}

function getTierBackgroundClass(tier: number, isValid: boolean): string {
    if (!isValid) {
        return "bg-destructive"
    }

    switch (tier) {
        case 1:
            return "bg-green-600"
        case 2:
            return "bg-orange-700"
        case 3:
            return "bg-[#1B3A0A]"
        case 4:
            return "bg-blue-700"
        default:
            return "bg-[#1B3A0A]"
    }
}

export function SemesterBox({
    status,
    semester,
    isValid,
    tier,
    onPress,
}: SemesterBoxProps): React.JSX.Element {
    const { t } = useTranslation()

    return (
        <Pressable
            className={cn(
                "w-[90%] items-center justify-center gap-1.5 rounded-2xl border border-white/20 px-5 py-3.5",
                getTierBackgroundClass(tier, isValid),
            )}
            onPress={onPress}
        >
            <View className="flex-row items-center gap-2">
                <MaterialIcons color="#ffffff" name={getTierIconName(tier)} size={24} />
                <Text className="font-inter-bold text-lg leading-6 text-primary-foreground">
                    {t("tierLabel", { tier })}
                </Text>
            </View>

            <Text className="font-inter-medium text-base leading-6 text-white/80">{status}</Text>

            <Text className="font-inter-extrabold text-xl leading-7 text-primary-foreground">
                {semester}
            </Text>
        </Pressable>
    )
}
