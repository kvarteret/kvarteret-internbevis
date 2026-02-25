import { MaterialIcons } from "@expo/vector-icons"
import { useNavigation } from "expo-router"
import React, { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { openExternalUrl } from "@/core/linking/linkClient"
import { themeColors } from "@/shared/theme/colors"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

interface ExternalLinkRowProps {
    label: string
    url: string
    isLast?: boolean
}

const ExternalLinkRow = ({
    label,
    url,
    isLast = false,
}: ExternalLinkRowProps): React.JSX.Element => {
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
                void openExternalUrl(url)
            }}
        >
            <View className="min-w-0 flex-1">
                <Text className="text-base text-text-primary font-semibold" numberOfLines={2}>
                    {label}
                </Text>
                <Text className="text-sm text-link" numberOfLines={1}>
                    {url}
                </Text>
            </View>
            <MaterialIcons color={themeColors.textSecondary} name="open-in-new" size={20} />
        </Pressable>
    )
}

export const AboutScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("about") })
    }, [navigation, t])

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right", "bottom"]}>
            <ScrollView
                className="flex-1"
                contentContainerClassName="px-4 pb-8 pt-4"
                contentInsetAdjustmentBehavior="automatic"
            >
                <Card className="mb-3 gap-3 px-4 py-4" effect="liquid" variant="grouped">
                    <Text className="text-2xl font-black text-text-primary">
                        {t("aboutKvarteretTitle")}
                    </Text>
                    <Text className="text-base leading-6 text-text-secondary">
                        {t("aboutKvarteretText")}
                    </Text>
                </Card>

                <Card className="mb-3 overflow-hidden" effect="liquid" variant="grouped">
                    <ExternalLinkRow
                        isLast
                        label={t("aboutKvarteretInstagram")}
                        url="https://www.instagram.com/kvarteretbergen/"
                    />
                </Card>

                <Card className="mb-3 gap-3 px-4 py-4" effect="liquid" variant="grouped">
                    <Text className="text-2xl font-black text-text-primary">
                        {t("aboutEtjenestenTitle")}
                    </Text>
                    <Text className="text-base leading-6 text-text-secondary">
                        {t("aboutEtjenestenText")}
                    </Text>
                    <Pressable
                        accessibilityHint="mailto:it.leder@kvarteret.no"
                        accessibilityLabel={t("aboutEmailLabel")}
                        accessibilityRole="link"
                        className="mt-1 flex-row items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3"
                        onPress={() => {
                            void openExternalUrl("mailto:it.leder@kvarteret.no")
                        }}
                    >
                        <MaterialIcons color={themeColors.textPrimary} name="email" size={18} />
                        <Text className="text-base font-semibold text-text-primary">
                            it.leder@kvarteret.no
                        </Text>
                    </Pressable>
                </Card>

                <Card className="mb-3 overflow-hidden" effect="liquid" variant="grouped">
                    <ExternalLinkRow
                        label={t("aboutInstagramEtjenesten")}
                        url="https://www.instagram.com/samfunnstjenesten/"
                    />
                    <ExternalLinkRow
                        label={t("aboutGithubOrg")}
                        url="https://github.com/kvarteret"
                    />
                    <ExternalLinkRow
                        isLast
                        label={t("aboutGithubApp")}
                        url="https://github.com/kvarteret/kvarteret-internbevis/"
                    />
                </Card>

                <EtjenestenFooter />
            </ScrollView>
        </SafeAreaView>
    )
}
