import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView } from "react-native"
import Markdown from "react-native-markdown-display"
import { RootStackParamList } from "@/app/navigation/types"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { PRIVACY_POLICY_MARKDOWN } from "@/features/privacy/domain/privacyPolicy"

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
        <ScrollView className="bg-surface" contentContainerClassName="px-4 py-4">
            <Markdown>{markdown}</Markdown>
        </ScrollView>
    )
}
