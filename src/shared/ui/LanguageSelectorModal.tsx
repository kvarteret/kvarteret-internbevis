import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, View } from "react-native"
import { SupportedLanguage, useLanguage } from "@/app/providers/LanguageProvider"
import { Card } from "@/shared/ui/Card"
import { themeColors } from "@/shared/theme/colors"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

interface LanguageSelectorModalProps {
    visible: boolean
    onClose: () => void
}

interface LanguageOption {
    code: SupportedLanguage
    label: string
    abbreviation: string
}

export const LanguageSelectorModal = ({
    visible,
    onClose,
}: LanguageSelectorModalProps): React.JSX.Element => {
    const { t } = useTranslation()
    const { language, changeLanguage } = useLanguage()

    const options: LanguageOption[] = [
        { code: "no", label: t("norwegian"), abbreviation: "NO" },
        { code: "en", label: t("english"), abbreviation: "EN" },
    ]

    const handleSelect = async (nextLanguage: SupportedLanguage): Promise<void> => {
        await changeLanguage(nextLanguage)
        onClose()
    }

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View className="flex-1 items-center justify-center bg-black/35 px-4">
                <Pressable className="absolute inset-0" onPress={onClose} />

                <Card
                    className="w-5/6 overflow-hidden rounded-3xl"
                    effect="liquid"
                    variant="elevated"
                >
                    <Text className="border-b border-editorial-border px-4 py-4 text-center text-xl font-bold">
                        {t("language")}
                    </Text>

                    {options.map(option => {
                        const selected = option.code === language

                        return (
                            <Pressable
                                key={option.code}
                                className={cn(
                                    "flex-row items-center border-b border-editorial-border px-6 py-4",
                                    selected ? "bg-surface/70" : "bg-transparent",
                                )}
                                onPress={() => {
                                    void handleSelect(option.code)
                                }}
                            >
                                <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-muted">
                                    <Text className="text-sm font-bold text-text-secondary">
                                        {option.abbreviation}
                                    </Text>
                                </View>

                                <Text
                                    className={cn(
                                        "ml-4 text-base text-text-primary",
                                        selected ? "font-bold" : "font-normal",
                                    )}
                                >
                                    {option.label}
                                </Text>

                                <View className="flex-1" />
                                {selected ? (
                                    <MaterialIcons name="check" size={20} color={themeColors.textSecondary} />
                                ) : null}
                            </Pressable>
                        )
                    })}
                </Card>
            </View>
        </Modal>
    )
}
