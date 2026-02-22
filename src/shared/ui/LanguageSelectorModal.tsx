import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, View } from "react-native"
import { useLanguage, SupportedLanguage } from "@/app/providers/LanguageProvider"
import { Text } from "@/shared/ui/Text"

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
            <View className="flex-1 items-center justify-center bg-[#00000059] px-4">
                <Pressable className="absolute inset-0" onPress={onClose} />

                <View className="w-[85%] overflow-hidden rounded-2xl border border-border-soft bg-surface">
                    <Text className="border-b border-border-soft px-4 py-4 text-center text-xl font-bold">
                        {t("language")}
                    </Text>

                    {options.map(option => {
                        const selected = option.code === language

                        return (
                            <Pressable
                                key={option.code}
                                className={[
                                    "flex-row items-center border-b border-border-soft px-6 py-4",
                                    selected ? "bg-surface-muted" : "bg-surface",
                                ].join(" ")}
                                onPress={() => {
                                    void handleSelect(option.code)
                                }}
                            >
                                <View className="h-9 w-9 items-center justify-center rounded-full bg-surface-muted">
                                    <Text className="text-[13px] font-bold text-text-secondary">
                                        {option.abbreviation}
                                    </Text>
                                </View>

                                <Text
                                    className={[
                                        "ml-4 text-base text-text-primary",
                                        selected ? "font-bold" : "font-normal",
                                    ].join(" ")}
                                >
                                    {option.label}
                                </Text>

                                <View className="flex-1" />
                                {selected ? (
                                    <MaterialIcons name="check" size={20} color="#374151" />
                                ) : null}
                            </Pressable>
                        )
                    })}
                </View>
            </View>
        </Modal>
    )
}
