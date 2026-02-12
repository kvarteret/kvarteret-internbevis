import React from "react"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, View } from "react-native"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupIndicator, RadioGroupItem } from "@/components/ui/radio-group"
import { Text } from "@/components/ui/text"
import { SupportedLanguage, useLanguage } from "../state/LanguageContext"

interface LanguageSelectorModalProps {
    visible: boolean
    onClose: () => void
}

interface LanguageOption {
    code: SupportedLanguage
    label: string
    abbreviation: string
}

export function LanguageSelectorModal({
    visible,
    onClose,
}: LanguageSelectorModalProps): React.JSX.Element {
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
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 items-center justify-center px-6">
                <Pressable className="absolute inset-0" onPress={onClose} />
                <View className="w-[85%] max-w-sm gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
                    <View className="border-b border-border px-4 py-4">
                        <Text className="text-center font-inter-bold text-xl text-foreground">
                            {t("language")}
                        </Text>
                    </View>

                    <RadioGroup
                        className="gap-0"
                        haptic="selection"
                        value={language}
                        onValueChange={nextLanguage => {
                            if (nextLanguage === "no" || nextLanguage === "en") {
                                void handleSelect(nextLanguage)
                            }
                        }}
                    >
                        {options.map((option, index) => {
                            const selected = option.code === language

                            return (
                                <RadioGroupItem
                                    key={option.code}
                                    asChild
                                    value={option.code}
                                >
                                    <Pressable
                                        accessibilityRole="radio"
                                        accessibilityState={{ checked: selected }}
                                        className={[
                                            "min-h-11 flex-row items-center px-6 py-4",
                                            selected ? "bg-muted" : "bg-card",
                                            index < options.length - 1 ? "border-b border-border" : "",
                                        ]
                                            .filter(Boolean)
                                            .join(" ")}
                                        onPress={() => {
                                            if (!selected) {
                                                void handleSelect(option.code)
                                            }
                                        }}
                                    >
                                        <Badge className="rounded-full" variant="secondary">
                                            <Text className="font-inter-bold text-[13px] text-secondary-foreground">
                                                {option.abbreviation}
                                            </Text>
                                        </Badge>

                                        <Text
                                            className={[
                                                "ml-4 text-base text-foreground",
                                                selected ? "font-inter-bold" : "font-inter",
                                            ].join(" ")}
                                        >
                                            {option.label}
                                        </Text>

                                        <View className="flex-1" />
                                        <View className="border-input bg-card dark:bg-input/30 h-5 w-5 items-center justify-center rounded-full border shadow-sm shadow-black/5">
                                            <RadioGroupIndicator />
                                        </View>
                                    </Pressable>
                                </RadioGroupItem>
                            )
                        })}
                    </RadioGroup>
                </View>
            </View>
        </Modal>
    )
}
