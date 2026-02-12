import React from "react"
import { useTranslation } from "react-i18next"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
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
        <Card className="w-full max-w-md items-center border-0 bg-transparent p-4 shadow-none">
            <Text className="text-center font-inter-extrabold text-2xl leading-8 text-foreground">{`${firstName} ${lastName}`}</Text>

            <Text className="text-center font-inter-medium text-xl leading-6 text-muted-foreground">
                {birthDateText}
            </Text>

            <Text className="mt-1.5 text-center font-inter-bold text-lg text-foreground">{`${t("pingvinPoints")}: ${pingvinPoengSum}`}</Text>

            <Text className="mt-1.5 text-center font-inter-semibold text-xl italic text-foreground">{`${t("wordOfTheDay")}: ${wordOfTheDayValue}`}</Text>
        </Card>
    )
}
