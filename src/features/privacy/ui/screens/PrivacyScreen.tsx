import { useNavigation } from "expo-router"
import React, { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView } from "react-native"
import Markdown from "react-native-markdown-display"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { PRIVACY_POLICY_MARKDOWN } from "@/features/privacy/domain/privacyPolicy"
import { themeColors } from "@/shared/theme/colors"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"

export const PrivacyScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const { language } = useLanguage()
    const markdown = PRIVACY_POLICY_MARKDOWN[language]

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("privacy") })
    }, [navigation, t])

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right", "bottom"]}>
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-4 pb-8 pt-4"
                contentInsetAdjustmentBehavior="automatic"
            >
                <Card className="mb-3 gap-2 px-4 py-4" effect="liquid" variant="grouped">
                    <Text className="text-2xl font-black text-text-primary">{t("privacy")}</Text>
                    <Text className="text-sm leading-5 text-text-secondary">
                        {t("privacyPolicyConsent")}
                    </Text>
                </Card>

                <Card className="px-4 py-4" effect="liquid" variant="grouped">
                    <Markdown
                        style={{
                            body: {
                                color: themeColors.editorialInk,
                                fontSize: 15,
                                lineHeight: 22,
                            },
                            heading1: {
                                color: themeColors.editorialInk,
                                fontSize: 26,
                                fontWeight: "700",
                                marginBottom: 10,
                            },
                            heading2: {
                                color: themeColors.editorialInk,
                                fontSize: 20,
                                fontWeight: "700",
                                marginBottom: 8,
                                marginTop: 4,
                            },
                            paragraph: {
                                marginBottom: 12,
                            },
                            bullet_list: {
                                marginBottom: 12,
                            },
                            list_item: {
                                marginBottom: 6,
                            },
                            link: {
                                color: themeColors.link,
                                textDecorationLine: "underline",
                            },
                        }}
                    >
                        {markdown}
                    </Markdown>
                </Card>

                <EtjenestenFooter />
            </ScrollView>
        </SafeAreaView>
    )
}
