import React, { useMemo } from "react"
import { TextStyle } from "react-native"
import Markdown from "react-native-markdown-display"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { PRIVACY_POLICY_MARKDOWN } from "@/features/privacy/domain/privacyPolicy"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"

export const PrivacyPolicyDocument = (): React.JSX.Element => {
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

    return <Markdown style={markdownStyle}>{markdown}</Markdown>
}
