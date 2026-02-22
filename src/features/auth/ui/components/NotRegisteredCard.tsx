import React from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"
import { Button } from "@/shared/ui/Button"
import { Text } from "@/shared/ui/Text"

interface NotRegisteredCardProps {
    onLogout: () => Promise<void>
}

export const NotRegisteredCard = ({ onLogout }: NotRegisteredCardProps): React.JSX.Element => {
    const { t } = useTranslation()

    return (
        <View className="flex-1 items-center justify-center bg-background px-4">
            <Text className="text-lg font-medium">{t("notRegistered")}</Text>
            <View className="mt-4 w-56">
                <Button onPress={() => void onLogout()}>
                    <Text className="text-base leading-5 text-surface font-semibold">
                        {t("logout")}
                    </Text>
                </Button>
            </View>
        </View>
    )
}
