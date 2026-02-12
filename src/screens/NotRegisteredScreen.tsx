import React from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { useUser } from "../state/UserContext"

export function NotRegisteredScreen(): React.JSX.Element {
    const { t } = useTranslation()
    const { logout } = useUser()

    return (
        <View className="flex-1 items-center justify-center bg-background px-4">
            <Text className="font-inter-medium text-lg text-foreground">{t("notRegistered")}</Text>
            <View className="mt-4 w-56">
                <Button
                    className="h-12 rounded-xl"
                    onPress={() => {
                        void logout()
                    }}
                >
                    <Text className="font-inter-semibold text-base leading-5">{t("logout")}</Text>
                </Button>
            </View>
        </View>
    )
}
