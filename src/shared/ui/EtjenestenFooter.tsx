import React from "react"
import { useTranslation } from "react-i18next"
import { TouchableOpacity, View } from "react-native"
import { openExternalUrl } from "@/core/linking/linkClient"
import { Text } from "@/shared/ui/Text"

export const EtjenestenFooter = (): React.JSX.Element => {
    const { t } = useTranslation()

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
                <Text className="px-1.5 text-2xl leading-8 text-editorial-ink" numberOfLines={1}>
                    |
                </Text>
                <TouchableOpacity
                    accessibilityRole="link"
                    onPress={() => void openExternalUrl("https://blifrivillig.no")}
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
            </View>
        </View>
    )
}
