import { useNavigation, useRouter } from "expo-router"
import React, { useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"
import { useAnalyticsConsent } from "@/app/providers/AnalyticsConsentProvider"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"

export const SettingsScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const router = useRouter()
    const { analyticsConsentStatus, declineAnalyticsConsent, grantAnalyticsConsent } =
        useAnalyticsConsent()
    const [isSubmitting, setIsSubmitting] = useState(false)

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("settings") })
    }, [navigation, t])

    const handleGrantAnalytics = async (): Promise<void> => {
        setIsSubmitting(true)

        try {
            await grantAnalyticsConsent("settings")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeclineAnalytics = async (): Promise<void> => {
        setIsSubmitting(true)

        try {
            await declineAnalyticsConsent("settings")
        } finally {
            setIsSubmitting(false)
        }
    }

    const analyticsStatusText =
        analyticsConsentStatus === "granted"
            ? t("analyticsSettingsStatusGranted")
            : analyticsConsentStatus === "declined"
              ? t("analyticsSettingsStatusDeclined")
              : t("analyticsSettingsStatusUndecided")

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerClassName="gap-3 px-4 pb-8 pt-4"
                contentInsetAdjustmentBehavior="automatic"
            >
                <Card className="gap-3 px-4 py-4" effect="liquid" variant="grouped">
                    <Text className="text-2xl font-black">{t("analyticsSettingsTitle")}</Text>
                    <Text className="text-base leading-6 text-text-secondary">
                        {t("analyticsSettingsBody")}
                    </Text>
                    <Text className="text-sm font-semibold text-text-secondary">
                        {analyticsStatusText}
                    </Text>
                    <View className="gap-3 pt-1">
                        <Button
                            disabled={isSubmitting || analyticsConsentStatus === "granted"}
                            onPress={() => {
                                void handleGrantAnalytics()
                            }}
                        >
                            {t("analyticsSettingsEnable")}
                        </Button>
                        <Button
                            disabled={isSubmitting || analyticsConsentStatus === "declined"}
                            variant="secondary"
                            onPress={() => {
                                void handleDeclineAnalytics()
                            }}
                        >
                            {t("analyticsSettingsDisable")}
                        </Button>
                        <Button
                            disabled={isSubmitting}
                            variant="ghost"
                            onPress={() => {
                                router.push("/privacy")
                            }}
                        >
                            {t("privacyDialogRead")}
                        </Button>
                    </View>
                </Card>

                <EtjenestenFooter />
            </ScrollView>
        </View>
    )
}
