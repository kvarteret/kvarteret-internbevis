import { MaterialIcons } from "@expo/vector-icons"
import { MenuAction, MenuView } from "@react-native-menu/menu"
import React from "react"
import { Image, Platform, PlatformColor, TouchableOpacity, View } from "react-native"
import { themeColors } from "@/shared/theme/colors"
import { Text } from "@/shared/ui/Text"

interface TopShellHeaderProps {
    openMenuLabel: string
    onOpenMenu: () => void
    menuActions: MenuAction[]
    onMenuAction: (id: string) => void
}

export const TopShellHeader = ({
    openMenuLabel,
    onOpenMenu,
    menuActions,
    onMenuAction,
}: TopShellHeaderProps): React.JSX.Element => {
    const iosMenuButtonStyle =
        Platform.OS === "ios"
            ? {
                  backgroundColor: PlatformColor("secondarySystemFillColor"),
                  borderColor: PlatformColor("separatorColor"),
              }
            : undefined
    const menuIconColor =
        Platform.OS === "ios" ? PlatformColor("labelColor") : themeColors.editorialInk

    const menuButton = (
        <View
            className={
                Platform.OS === "ios"
                    ? "h-10 w-10 items-center justify-center rounded-full border"
                    : "h-10 w-10 items-center justify-center rounded-full border border-editorial-border bg-surface-muted"
            }
            pointerEvents="none"
            style={iosMenuButtonStyle}
        >
            <MaterialIcons color={menuIconColor} name="menu" size={22} />
        </View>
    )

    return (
        <View className="h-20 flex-row items-center px-4 pt-2">
            <View className="h-10 w-10 items-start justify-center">
                <Image
                    resizeMode="contain"
                    source={require("@assets/images/nobg.png")}
                    style={{ width: 40, height: 26 }}
                />
            </View>

            <View className="flex-1 items-center px-2">
                <Text
                    className="text-base font-extrabold text-editorial-ink uppercase"
                    numberOfLines={1}
                    style={{ letterSpacing: 2 }}
                >
                    Det Akademiske Kvarter
                </Text>
            </View>

            {Platform.OS === "web" ? (
                <TouchableOpacity
                    accessibilityLabel={openMenuLabel}
                    accessibilityRole="button"
                    className="items-end"
                    hitSlop={8}
                    onPress={onOpenMenu}
                >
                    {menuButton}
                </TouchableOpacity>
            ) : (
                <View className="items-end">
                    <MenuView
                        actions={menuActions}
                        shouldOpenOnLongPress={false}
                        {...(Platform.OS === "android" ? { isAnchoredToRight: true } : {})}
                        onPressAction={({ nativeEvent }) => onMenuAction(nativeEvent.event)}
                    >
                        {menuButton}
                    </MenuView>
                </View>
            )}
        </View>
    )
}
