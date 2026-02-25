import { MaterialIcons } from "@expo/vector-icons"
import { MenuAction, MenuView } from "@react-native-menu/menu"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Animated, Easing, Platform, PlatformColor, Pressable, StyleSheet, View } from "react-native"
import { Divider, Menu as PaperMenu } from "react-native-paper"
import { NATIVE_MENU_ACTION_ID } from "@/features/dashboard/ui/menu/nativeMenuActions"
import { themeColors } from "@/shared/theme/colors"
import { Text } from "@/shared/ui/Text"
import { triggerSoftImpactHaptic } from "@/shared/utils/haptics"

interface NativeHeaderMenuButtonProps {
    openMenuLabel: string
    menuActions: MenuAction[]
    onMenuAction: (id: string) => void
}

interface AndroidMenuItem {
    key: string
    id: string
    title: string
    destructive: boolean
    disabled: boolean
}

interface AndroidMenuGroup {
    key: string
    title: string | null
    items: AndroidMenuItem[]
}

const resolveAndroidMenuIcon = (actionId: string): string | undefined => {
    switch (actionId) {
        case NATIVE_MENU_ACTION_ID.privacy:
            return "shield-lock-outline"
        case NATIVE_MENU_ACTION_ID.about:
            return "information-outline"
        case NATIVE_MENU_ACTION_ID.games:
            return "gamepad-variant-outline"
        case NATIVE_MENU_ACTION_ID.authLogin:
            return "login"
        case NATIVE_MENU_ACTION_ID.authLogout:
            return "logout"
        case NATIVE_MENU_ACTION_ID.languageNo:
        case NATIVE_MENU_ACTION_ID.languageEn:
            return "translate"
        default:
            return undefined
    }
}

const buildAndroidMenuGroups = (actions: MenuAction[]): AndroidMenuGroup[] => {
    const groups: AndroidMenuGroup[] = []

    actions.forEach(action => {
        if (action.attributes?.hidden) return

        const actionId = action.id ?? action.title
        const subactions = action.subactions?.filter(subaction => !subaction.attributes?.hidden) ?? []

        if (subactions.length > 0) {
            groups.push({
                key: `group:${actionId}`,
                title: action.title,
                items: subactions.map(subaction => {
                    const subactionId = subaction.id ?? subaction.title
                    return {
                        key: `item:${subactionId}`,
                        id: subactionId,
                        title: subaction.title,
                        destructive: Boolean(subaction.attributes?.destructive),
                        disabled: Boolean(subaction.attributes?.disabled),
                    }
                }),
            })
            return
        }

        groups.push({
            key: `group:${actionId}`,
            title: null,
            items: [
                {
                    key: `item:${actionId}`,
                    id: actionId,
                    title: action.title,
                    destructive: Boolean(action.attributes?.destructive),
                    disabled: Boolean(action.attributes?.disabled),
                },
            ],
        })
    })

    return groups
}

export const NativeHeaderMenuButton = ({
    openMenuLabel,
    menuActions,
    onMenuAction,
}: NativeHeaderMenuButtonProps): React.JSX.Element => {
    const isAndroid = Platform.OS === "android"
    const [isAndroidMenuOpen, setAndroidMenuOpen] = useState(false)
    const menuAnimation = useRef(new Animated.Value(0)).current
    const nativeTriggerHitSlop = { top: 8, bottom: 8, left: 8, right: 8 }
    const nativeTriggerStyle = {
        width: isAndroid ? 48 : 40,
        height: isAndroid ? 48 : 40,
        alignItems: "center" as const,
        justifyContent: "center" as const,
    }
    const iosMenuButtonStyle =
        Platform.OS === "ios" ? { backgroundColor: "transparent" } : undefined
    const menuIconColor =
        Platform.OS === "ios" ? PlatformColor("labelColor") : themeColors.editorialInk
    const androidMenuGroups = useMemo(() => buildAndroidMenuGroups(menuActions), [menuActions])

    useEffect(() => {
        if (!isAndroid) return

        Animated.timing(menuAnimation, {
            toValue: isAndroidMenuOpen ? 1 : 0,
            duration: 170,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start()
    }, [isAndroid, isAndroidMenuOpen, menuAnimation])

    const openAndroidMenu = (): void => {
        setAndroidMenuOpen(true)
        void triggerSoftImpactHaptic()
    }

    const closeAndroidMenu = (): void => {
        setAndroidMenuOpen(false)
    }

    const pressAndroidMenuAction = (id: string): void => {
        closeAndroidMenu()
        onMenuAction(id)
        void triggerSoftImpactHaptic()
    }

    const animatedAndroidIconStyle = {
        transform: [
            {
                rotate: menuAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0deg", "90deg"],
                }),
            },
            {
                scale: menuAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.92],
                }),
            },
        ],
    }

    if (isAndroid) {
        return (
            <View className="items-end">
                <PaperMenu
                    anchor={
                        <Pressable
                            accessibilityLabel={openMenuLabel}
                            accessibilityRole="button"
                            android_ripple={{ color: "rgba(0,0,0,0.14)", borderless: false, radius: 24 }}
                            className="h-12 w-12 items-center justify-center rounded-full"
                            hitSlop={nativeTriggerHitSlop}
                            style={({ pressed }) => (pressed ? { opacity: 0.96 } : null)}
                            onPress={openAndroidMenu}
                        >
                            <Animated.View style={animatedAndroidIconStyle}>
                                <MaterialIcons color={menuIconColor} name="more-vert" size={22} />
                            </Animated.View>
                        </Pressable>
                    }
                    anchorPosition="bottom"
                    contentStyle={styles.androidMenuSurface}
                    visible={isAndroidMenuOpen}
                    onDismiss={closeAndroidMenu}
                >
                    {androidMenuGroups.map((group, groupIndex) => (
                        <View key={group.key}>
                            {groupIndex > 0 ? <Divider /> : null}
                            {group.title ? (
                                <Text className="px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
                                    {group.title}
                                </Text>
                            ) : null}
                            {group.items.map(item => (
                                <PaperMenu.Item
                                    key={item.key}
                                    disabled={item.disabled}
                                    leadingIcon={resolveAndroidMenuIcon(item.id)}
                                    onPress={() => pressAndroidMenuAction(item.id)}
                                    title={item.title}
                                    titleStyle={item.destructive ? styles.destructiveItemTitle : undefined}
                                />
                            ))}
                        </View>
                    ))}
                </PaperMenu>
            </View>
        )
    }

    return (
        <View className="items-end">
            <MenuView
                style={nativeTriggerStyle}
                actions={menuActions}
                hitSlop={nativeTriggerHitSlop}
                shouldOpenOnLongPress={false}
                title=""
                onPressAction={({ nativeEvent }) => onMenuAction(nativeEvent.event)}
            >
                <Pressable
                    accessibilityLabel={openMenuLabel}
                    accessibilityRole="button"
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={iosMenuButtonStyle}
                >
                    <MaterialIcons color={menuIconColor} name="more-vert" size={22} />
                </Pressable>
            </MenuView>
        </View>
    )
}

const styles = StyleSheet.create({
    androidMenuSurface: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: themeColors.androidSurfaceOutline,
        backgroundColor: themeColors.androidCardElevatedSurface,
    },
    destructiveItemTitle: {
        color: themeColors.stateDanger,
    },
})
