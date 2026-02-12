import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, View } from "react-native"
import { Button } from "@/components/ui/button"
import { Text } from "@/components/ui/text"
import { cn } from "@/lib/utils"

interface MenuSheetProps {
    visible: boolean
    onClose: () => void
    onOpenPrivacy: () => void
    onOpenGames: () => void
    onOpenKvarteretSkjerm: () => void
    onOpenLanguage: () => void
    onLogout: () => void
}

interface Action {
    key: "privacy" | "games" | "kvarteretSkjerm" | "language" | "logout"
    label: string
    icon: keyof typeof MaterialIcons.glyphMap
    destructive?: boolean
    onPress: () => void
}

export function MenuSheet({
    visible,
    onClose,
    onOpenPrivacy,
    onOpenGames,
    onOpenKvarteretSkjerm,
    onOpenLanguage,
    onLogout,
}: MenuSheetProps): React.JSX.Element {
    const { t } = useTranslation()

    const actions: Action[] = [
        { key: "privacy", label: t("privacy"), icon: "privacy-tip", onPress: onOpenPrivacy },
        { key: "language", label: t("language"), icon: "language", onPress: onOpenLanguage },
        { key: "games", label: t("games"), icon: "sports-esports", onPress: onOpenGames },
        {
            key: "kvarteretSkjerm",
            label: t("kvarteretSkjerm"),
            icon: "tv",
            onPress: onOpenKvarteretSkjerm,
        },
        {
            key: "logout",
            label: t("logout"),
            icon: "logout",
            destructive: true,
            onPress: onLogout,
        },
    ]

    const handlePress = (action: Action): void => {
        onClose()
        action.onPress()
    }

    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                <Pressable className="flex-1" onPress={onClose} />
                <View className="w-full gap-0 overflow-hidden rounded-t-2xl rounded-b-none border border-border bg-card p-0 pb-5">
                    {actions.map((action, index) => (
                        <Button
                            key={action.key}
                            className={cn(
                                "min-h-11 h-auto justify-start rounded-none px-5 py-4",
                                index < actions.length - 1 && "border-b border-border",
                            )}
                            androidRipple={{ color: "rgba(17, 24, 39, 0.08)", borderless: false }}
                            haptic="selection"
                            nativeFeedback="opacity"
                            variant="ghost"
                            onPress={() => handlePress(action)}
                        >
                            <MaterialIcons
                                color={action.destructive ? "#dc2626" : "#111827"}
                                name={action.icon}
                                size={20}
                            />
                            <Text
                                className={cn(
                                    "font-inter-medium text-base",
                                    action.destructive ? "text-destructive" : "text-foreground",
                                )}
                            >
                                {action.label}
                            </Text>
                        </Button>
                    ))}
                </View>
            </View>
        </Modal>
    )
}
