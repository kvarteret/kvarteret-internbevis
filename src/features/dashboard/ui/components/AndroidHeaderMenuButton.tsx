import { MaterialIcons } from "@expo/vector-icons"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { Animated, Easing, Pressable, View, ViewStyle } from "react-native"
import { Divider, Menu as PaperMenu } from "react-native-paper"
import { AppHeaderMenuItem } from "@/features/dashboard/ui/menu/headerMenu.types"
import { NATIVE_MENU_ACTION_ID } from "@/features/dashboard/ui/menu/nativeMenuActions"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { Text } from "@/shared/ui/Text"
import { triggerSoftImpactHaptic } from "@/shared/utils/haptics"

interface AndroidHeaderMenuButtonProps {
    openMenuLabel: string
    menuActions: AppHeaderMenuItem[]
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

const triggerHitSlop = { top: 8, bottom: 8, left: 8, right: 8 }
const ANDROID_MENU_ICON_ANIMATION_DURATION_MS = 260
const ANDROID_MENU_ANIMATION_SCALE = 1.3

const resolveAndroidMenuIcon = (actionId: string): string | undefined => {
    switch (actionId) {
        case NATIVE_MENU_ACTION_ID.privacy:
            return "shield-lock-outline"
        case NATIVE_MENU_ACTION_ID.about:
            return "information-outline"
        case NATIVE_MENU_ACTION_ID.feedback:
            return "message-reply-text-outline"
        case NATIVE_MENU_ACTION_ID.benefits:
            return "star-outline"
        case NATIVE_MENU_ACTION_ID.nerdStats:
            return "query-stats"
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

const buildAndroidMenuGroups = (actions: AppHeaderMenuItem[]): AndroidMenuGroup[] => {
    const groups: AndroidMenuGroup[] = []

    actions.forEach(action => {
        if (action.attributes?.hidden) return

        const actionId = action.id ?? action.title
        const subactions =
            action.subactions?.filter(subaction => !subaction.attributes?.hidden) ?? []

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

export const AndroidHeaderMenuButton = ({
    openMenuLabel,
    menuActions,
    onMenuAction,
}: AndroidHeaderMenuButtonProps): React.JSX.Element => {
    const [isAndroidMenuOpen, setAndroidMenuOpen] = useState(false)
    const menuAnimation = useRef(new Animated.Value(0)).current
    const colors = useThemeRuntimeColors()
    const menuIconColor = colors.editorialInk
    const androidMenuGroups = useMemo(() => buildAndroidMenuGroups(menuActions), [menuActions])
    const androidMenuSurfaceStyle = useMemo<ViewStyle>(
        () => ({
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.androidSurfaceOutline,
            backgroundColor: colors.androidCardElevatedSurface,
        }),
        [colors.androidCardElevatedSurface, colors.androidSurfaceOutline],
    )
    const destructiveItemTitleStyle = useMemo(
        () => ({
            color: colors.stateDanger,
        }),
        [colors.stateDanger],
    )

    useEffect(() => {
        Animated.timing(menuAnimation, {
            toValue: isAndroidMenuOpen ? 1 : 0,
            duration: ANDROID_MENU_ICON_ANIMATION_DURATION_MS,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
        }).start()
    }, [isAndroidMenuOpen, menuAnimation])

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

    return (
        <View className="items-end">
            <PaperMenu
                anchor={
                    <Pressable
                        accessibilityLabel={openMenuLabel}
                        accessibilityRole="button"
                        android_ripple={{
                            color: "rgba(0,0,0,0.14)",
                            borderless: false,
                            radius: 24,
                        }}
                        className="h-12 w-12 items-center justify-center rounded-full active:opacity-95"
                        hitSlop={triggerHitSlop}
                        onPress={openAndroidMenu}
                    >
                        <Animated.View style={animatedAndroidIconStyle}>
                            <MaterialIcons color={menuIconColor} name="more-vert" size={22} />
                        </Animated.View>
                    </Pressable>
                }
                anchorPosition="bottom"
                contentStyle={androidMenuSurfaceStyle}
                theme={{ animation: { scale: ANDROID_MENU_ANIMATION_SCALE } }}
                visible={isAndroidMenuOpen}
                onDismiss={closeAndroidMenu}
            >
                {androidMenuGroups.map((group, groupIndex) => (
                    <View key={group.key}>
                        {groupIndex > 0 ? <Divider /> : null}
                        {group.title ? (
                            <Text className="px-4 pb-1 pt-3 text-xs text-text-secondary font-semibold uppercase tracking-wide">
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
                                titleStyle={
                                    item.destructive ? destructiveItemTitleStyle : undefined
                                }
                            />
                        ))}
                    </View>
                ))}
            </PaperMenu>
        </View>
    )
}
