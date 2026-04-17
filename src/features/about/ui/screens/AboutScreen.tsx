import { MaterialIcons } from "@expo/vector-icons"
import { useNavigation } from "expo-router"
import React, { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, View } from "react-native"
import { useAppAnalytics } from "@/app/providers/AppAnalyticsProvider"
import { openExternalUrl } from "@/core/linking/linkClient"
import { ANALYTICS_EVENT, getAnalyticsDestinationHost } from "@/features/analytics/domain/analytics"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

interface ExternalLinkRowProps {
    destinationType: string
    onTrack: (url: string, destinationType: string) => void
    label: string
    url: string
    isLast?: boolean
}

const ExternalLinkRow = ({
    destinationType,
    onTrack,
    label,
    url,
    isLast = false,
}: ExternalLinkRowProps): React.JSX.Element => {
    const { textSecondary } = useThemeRuntimeColors()

    return (
        <Pressable
            accessibilityHint={url}
            accessibilityLabel={label}
            accessibilityRole="link"
            className={cn(
                "flex-row items-center justify-between gap-3 px-4 py-3.5",
                !isLast && "border-b border-editorial-border",
            )}
            onPress={() => {
                onTrack(url, destinationType)
                void openExternalUrl(url)
            }}
        >
            <View className="min-w-0 flex-1">
                <Text className="text-base font-semibold" numberOfLines={2}>
                    {label}
                </Text>
                <Text className="text-sm text-link" numberOfLines={1}>
                    {url}
                </Text>
            </View>
            <MaterialIcons color={textSecondary} name="open-in-new" size={20} />
        </Pressable>
    )
}

export const AboutScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const { track } = useAppAnalytics()
    const { textPrimary } = useThemeRuntimeColors()

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("about") })
    }, [navigation, t])

    const trackExternalLink = (url: string, destinationType: string): void => {
        track(ANALYTICS_EVENT.aboutExternalLinkClicked, {
            destination_host: getAnalyticsDestinationHost(url),
            destination_type: destinationType,
            destination_url: url,
            link_location: "about_card",
        })
    }

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-4 pb-8 pt-4"
                contentInsetAdjustmentBehavior="automatic"
            >
                <Card className="mb-3 gap-3 px-4 py-4" effect="liquid" variant="grouped">
                    <Text className="text-2xl font-black">{t("aboutKvarteretTitle")}</Text>
                    <Text className="text-base leading-6 text-text-secondary">
                        {t("aboutKvarteretText")}
                    </Text>
                </Card>

                <Card className="mb-3 overflow-hidden" effect="liquid" variant="grouped">
                    <ExternalLinkRow
                        destinationType="instagram"
                        isLast
                        label={t("aboutKvarteretInstagram")}
                        onTrack={trackExternalLink}
                        url="https://www.instagram.com/kvarteretbergen/"
                    />
                </Card>

                <Card className="mb-3 gap-3 px-4 py-4" effect="liquid" variant="grouped">
                    <Text className="text-2xl font-black">{t("aboutEtjenestenTitle")}</Text>
                    <Text className="text-base leading-6 text-text-secondary">
                        {t("aboutEtjenestenText")}
                    </Text>
                    <Pressable
                        accessibilityHint="mailto:it.leder@kvarteret.no"
                        accessibilityLabel={t("aboutEmailLabel")}
                        accessibilityRole="link"
                        className="mt-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3"
                        onPress={() => {
                            const url = "mailto:it.leder@kvarteret.no"
                            trackExternalLink(url, "email")
                            void openExternalUrl(url)
                        }}
                    >
                        <MaterialIcons color={textPrimary} name="email" size={18} />
                        <Text className="text-base font-semibold">it.leder@kvarteret.no</Text>
                    </Pressable>
                </Card>

                <Card className="mb-3 overflow-hidden" effect="liquid" variant="grouped">
                    <ExternalLinkRow
                        destinationType="instagram"
                        label={t("aboutInstagramEtjenesten")}
                        onTrack={trackExternalLink}
                        url="https://www.instagram.com/samfunnstjenesten/"
                    />
                    <ExternalLinkRow
                        destinationType="github"
                        label={t("aboutGithubOrg")}
                        onTrack={trackExternalLink}
                        url="https://github.com/kvarteret"
                    />
                    <ExternalLinkRow
                        destinationType="github"
                        isLast
                        label={t("aboutGithubApp")}
                        onTrack={trackExternalLink}
                        url="https://github.com/kvarteret/kvarteret-internbevis/"
                    />
                </Card>

                <EtjenestenFooter />
            </ScrollView>
        </View>
    )
}
