import { useNavigation, useRouter } from "expo-router"
import React, { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"
import { PrivacyPolicyDocument } from "@/features/privacy/ui/components/PrivacyPolicyDocument"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"

export const PrivacyScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const router = useRouter()

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("privacy") })
    }, [navigation, t])

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-4 pb-8 pt-5"
                contentInsetAdjustmentBehavior="automatic"
            >
                <Card className="mb-4 gap-3 px-4 py-4" effect="liquid" variant="grouped">
                    <Text className="text-2xl font-black">{t("analyticsSettingsTitle")}</Text>
                    <Text className="text-base leading-6 text-text-secondary">
                        {t("privacyManageAnalyticsText")}
                    </Text>
                    <Button
                        variant="secondary"
                        onPress={() => {
                            router.push("/settings")
                        }}
                    >
                        {t("privacyManageAnalyticsAction")}
                    </Button>
                </Card>

                <View className="w-full px-1 py-2">
                    <PrivacyPolicyDocument />
                </View>

                <EtjenestenFooter />
            </ScrollView>
        </View>
    )
}
