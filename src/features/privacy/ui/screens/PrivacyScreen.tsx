import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView } from "react-native"
import Markdown from "react-native-markdown-display"
import { SafeAreaView } from "react-native-safe-area-context"
import { RootStackParamList } from "@/app/navigation/types"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { PRIVACY_POLICY_MARKDOWN } from "@/features/privacy/domain/privacyPolicy"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"

export const PrivacyScreen = ({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "Privacy">): React.JSX.Element => {
    const { t } = useTranslation()
    const { language } = useLanguage()
    const markdown = PRIVACY_POLICY_MARKDOWN[language]

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("privacy") })
    }, [navigation, t])

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8 pt-4">
                <Card className="mb-3 px-4 py-4" effect="liquid" variant="grouped">
                    <Text className="text-2xl font-black text-text-primary">{t("privacy")}</Text>
                </Card>

                <Card className="px-4 py-4" variant="grouped">
                    <Markdown
                        style={{
                            body: {
                                color: "#111827",
                                fontSize: 15,
                                lineHeight: 22,
                            },
                            heading1: {
                                color: "#0F172A",
                                fontSize: 26,
                                fontWeight: "700",
                                marginBottom: 10,
                            },
                            heading2: {
                                color: "#111827",
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
                                color: "#2563EB",
                                textDecorationLine: "underline",
                            },
                        }}
                    >
                        {markdown}
                    </Markdown>
                </Card>
            </ScrollView>
        </SafeAreaView>
    )
}
