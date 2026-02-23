import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, View } from "react-native"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

interface MenuSheetProps {
    visible: boolean
    onClose: () => void
    onOpenPrivacy: () => void
    onOpenGames: () => void
    onOpenLanguage: () => void
    authAction: {
        label: string
        icon: keyof typeof MaterialIcons.glyphMap
        destructive?: boolean
        onPress: () => void
    }
}

interface Action {
    key: "privacy" | "games" | "language" | "auth"
    label: string
    icon: keyof typeof MaterialIcons.glyphMap
    destructive?: boolean
    onPress: () => void
}

export const MenuSheet = ({
    visible,
    onClose,
    onOpenPrivacy,
    onOpenGames,
    onOpenLanguage,
    authAction,
}: MenuSheetProps): React.JSX.Element => {
    const { t } = useTranslation()

    const actions: Action[] = [
        { key: "privacy", label: t("privacy"), icon: "privacy-tip", onPress: onOpenPrivacy },
        { key: "language", label: t("language"), icon: "language", onPress: onOpenLanguage },
        { key: "games", label: t("games"), icon: "sports-esports", onPress: onOpenGames },
        { key: "auth", ...authAction },
    ]

    const handlePress = (action: Action): void => {
        onClose()
        action.onPress()
    }

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-[#00000033]">
                <Pressable className="absolute inset-0" onPress={onClose} />

                <Card
                    className="mx-2 mb-2 overflow-hidden rounded-3xl pb-2"
                    effect="liquid"
                    variant="grouped"
                >
                    <View className="items-center px-4 pb-2 pt-3">
                        <View className="h-1.5 w-10 rounded-full bg-[#00000033]" />
                    </View>
                    {actions.map((action, index) => (
                        <Pressable
                            key={action.key}
                            className={cn(
                                "flex-row items-center gap-3 px-5 py-4",
                                index < actions.length - 1 && "border-b border-[#0000001A]",
                            )}
                            onPress={() => handlePress(action)}
                        >
                            <MaterialIcons
                                name={action.icon}
                                size={20}
                                color={action.destructive ? "#AA0000" : "#000000"}
                            />
                            <Text
                                className={
                                    action.destructive
                                        ? "text-base text-state-danger font-medium"
                                        : "text-base text-text-primary font-medium"
                                }
                            >
                                {action.label}
                            </Text>
                        </Pressable>
                    ))}
                </Card>
            </View>
        </Modal>
    )
}
