import { useNavigation } from "expo-router"
import React, { useLayoutEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, TextStyle, View } from "react-native"
import Markdown from "react-native-markdown-display"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { PRIVACY_POLICY_MARKDOWN } from "@/features/privacy/domain/privacyPolicy"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"

export const PrivacyScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const { language } = useLanguage()
    const colors = useThemeRuntimeColors()
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

                <EtjenestenFooter />
            </ScrollView>
        </View>
    )
}
