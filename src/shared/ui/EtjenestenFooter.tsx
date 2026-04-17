import React from "react"
import { useTranslation } from "react-i18next"
import { TouchableOpacity, View } from "react-native"
import { useAppAnalytics } from "@/app/providers/AppAnalyticsProvider"
import { useSession } from "@/app/providers/SessionProvider"
import { openExternalUrl } from "@/core/linking/linkClient"
import { ANALYTICS_EVENT, getAnalyticsDestinationHost } from "@/features/analytics/domain/analytics"
import { Text } from "@/shared/ui/Text"

export const EtjenestenFooter = (): React.JSX.Element => {
    const { t } = useTranslation()
    const { track } = useAppAnalytics()
    const { isAnonymous, user } = useSession()
    const showVolunteerLink = !user || isAnonymous
    const volunteerUrl = "https://blifrivillig.no"

    return (
        <View className="w-full items-center justify-center pt-1 pb-2">
            <View className="w-full flex-row items-center justify-center px-3">
                <Text
                    adjustsFontSizeToFit
                    className="flex-shrink text-lg leading-6 text-editorial-ink font-medium"
                    ellipsizeMode="tail"
                    minimumFontScale={0.72}
                    numberOfLines={1}
                >
                    {t("homeFooterPrefix")}
                </Text>
                {showVolunteerLink ? (
                    <>
                        <Text
                            className="px-1.5 text-2xl leading-8 text-editorial-ink"
                            numberOfLines={1}
                        >
                            |
                        </Text>
                        <TouchableOpacity
                            accessibilityRole="link"
                            onPress={() => {
                                track(ANALYTICS_EVENT.volunteerCtaClicked, {
                                    funnel_area: "volunteer",
                                    destination_host: getAnalyticsDestinationHost(volunteerUrl),
                                    destination_type: "volunteer",
                                    destination_url: volunteerUrl,
                                    link_location: "footer",
                                })
                                void openExternalUrl(volunteerUrl)
                            }}
                            className="flex-shrink"
                        >
                            <Text
                                adjustsFontSizeToFit
                                className="text-lg leading-6 text-editorial-ink underline font-extrabold"
                                ellipsizeMode="tail"
                                minimumFontScale={0.72}
                                numberOfLines={1}
                            >
                                {t("homeFooterVolunteer")}
                            </Text>
                        </TouchableOpacity>
                    </>
                ) : null}
            </View>
        </View>
    )
}
