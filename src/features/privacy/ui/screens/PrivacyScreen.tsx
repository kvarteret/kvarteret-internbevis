import { useNavigation } from "expo-router"
import React, { useLayoutEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, Switch, Text, type TextStyle, View } from "react-native"
import Markdown from "react-native-markdown-display"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { PRODUCT_ANALYTICS_PREFERENCE_KEY, setProductAnalyticsEnabled } from "@/core/observability"
import { getStoredValue } from "@/core/storage/asyncStorage"
import { PRIVACY_POLICY_MARKDOWN } from "@/features/privacy/domain/privacyPolicy"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"

export const PrivacyScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const { language } = useLanguage()
    const colors = useThemeRuntimeColors()
    const [productAnalyticsEnabled, setProductAnalyticsEnabledState] = React.useState(false)
    const markdown = PRIVACY_POLICY_MARKDOWN[language]
    const markdownStyle = useMemo(
        () => ({
            body: {
                color: colors.editorialInk,
                fontSize: 15,
                lineHeight: 22,
            } satisfies TextStyle,
            heading1: {
                color: colors.editorialInk,
                fontSize: 26,
                lineHeight: 32,
                fontWeight: "700" as const,
                marginBottom: 10,
                marginTop: 2,
            } satisfies TextStyle,
            heading2: {
                color: colors.editorialInk,
                fontSize: 20,
                lineHeight: 26,
                fontWeight: "700" as const,
                marginBottom: 8,
                marginTop: 4,
            } satisfies TextStyle,
            paragraph: {
                marginBottom: 12,
            },
            link: {
                color: colors.link,
                textDecorationLine: "underline" as const,
            } satisfies TextStyle,
        }),
        [colors.editorialInk, colors.link],
    )

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("privacy") })
    }, [navigation, t])

    React.useEffect(() => {
        void getStoredValue(PRODUCT_ANALYTICS_PREFERENCE_KEY).then(value => {
            setProductAnalyticsEnabledState(value === "true")
        })
    }, [])

    const toggleProductAnalytics = async (enabled: boolean): Promise<void> => {
        setProductAnalyticsEnabledState(enabled)
        try {
            await setProductAnalyticsEnabled(enabled)
        } catch {
            setProductAnalyticsEnabledState(!enabled)
        }
    }

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-4 pb-8 pt-5"
                contentInsetAdjustmentBehavior="automatic"
            >
                <View className="w-full px-1 py-2">
                    <Markdown style={markdownStyle}>{markdown}</Markdown>
                </View>

                <View className="mx-1 mb-6 gap-2 rounded-2xl border border-editorial-border bg-surface px-4 py-4">
                    <Text className="text-base font-semibold text-editorial-ink">
                        {t("productAnalyticsTitle")}
                    </Text>
                    <Text className="text-sm leading-5 text-text-secondary">
                        {t("productAnalyticsDescription")}
                    </Text>
                    <View className="flex-row items-center justify-between gap-4">
                        <Text className="flex-1 text-sm font-medium text-editorial-ink">
                            {t("productAnalyticsToggle")}
                        </Text>
                        <Switch
                            accessibilityLabel={t("productAnalyticsToggle")}
                            onValueChange={toggleProductAnalytics}
                            value={productAnalyticsEnabled}
                        />
                    </View>
                </View>

                <EtjenestenFooter />
            </ScrollView>
        </View>
    )
}
