import React from "react"
import { useTranslation } from "react-i18next"
import { Text, View } from "react-native"
import { formatDate } from "../../utils/date"

interface UserInfoCardProps {
    firstName: string
    lastName: string
    birthDate: Date | null
    pingvinPoengSum: number
    dagensOrd: string
}

function normalizeWordOfTheDay(value: string): string {
    return value
        .replace(/^dagens ord:\s*/i, "")
        .replace(/^word of the day:\s*/i, "")
        .trim()
}

export function UserInfoCard({
    firstName,
    lastName,
    birthDate,
    pingvinPoengSum,
    dagensOrd,
}: UserInfoCardProps): React.JSX.Element {
    const { t } = useTranslation()

    const wordOfTheDayValue = normalizeWordOfTheDay(dagensOrd)
    const birthDateText = birthDate ? formatDate(birthDate) : "-"

    return (
        <View className="w-full max-w-md items-center rounded-card border border-border-soft px-5 py-4">
            <Text className="text-center font-inter-extrabold text-2xl leading-8 text-text-primary">{`${firstName} ${lastName}`}</Text>

            <Text className="text-center font-inter-medium text-xl leading-6 text-text-secondary">
                {birthDateText}
            </Text>

            <Text className="mt-1.5 text-center font-inter-bold text-lg text-text-primary">{`${t("pingvinPoints")}: ${pingvinPoengSum}`}</Text>

            <Text className="mt-1.5 text-center font-inter-semibold text-xl italic text-text-primary">{`${t("wordOfTheDay")}: ${wordOfTheDayValue}`}</Text>
        </View>
    )
}
