import {
    type NativeStackHeaderItemMenuAction,
    type NativeStackHeaderItemMenuSubmenu,
} from "@react-navigation/native-stack"
import { useRouter } from "expo-router"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Platform } from "react-native"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { useSession } from "@/app/providers/SessionProvider"
import { AppHeaderMenuItem } from "@/features/dashboard/ui/menu/headerMenu.types"
import {
    buildNativeMenuActions,
    NATIVE_MENU_ACTION_ID,
} from "@/features/dashboard/ui/menu/nativeMenuActions"

const toNativeMenuIcon = (image?: string) =>
    image
        ? {
              type: "sfSymbol" as const,
              name: image as any,
          }
        : undefined

const toNativeMenuItem = (
    action: AppHeaderMenuItem,
    onAction: (id: string) => void,
): NativeStackHeaderItemMenuAction | NativeStackHeaderItemMenuSubmenu => {
    const actionId = action.id ?? action.title

    if (action.subactions && action.subactions.length > 0) {
        return {
            type: "submenu",
            label: action.title,
            icon: toNativeMenuIcon(action.image),
            inline: action.displayInline ?? false,
            items: action.subactions.map(subaction => toNativeMenuItem(subaction, onAction)),
        }
    }

    return {
        type: "action",
        label: action.title,
        description: action.subtitle,
        icon: toNativeMenuIcon(action.image),
        destructive: action.attributes?.destructive,
        disabled: action.attributes?.disabled,
        hidden: action.attributes?.hidden,
        state: action.state,
        onPress: () => onAction(actionId),
    }
}

const toNativeMenuItems = (
    actions: AppHeaderMenuItem[],
    onAction: (id: string) => void,
): (NativeStackHeaderItemMenuAction | NativeStackHeaderItemMenuSubmenu)[] =>
    actions.map(action => toNativeMenuItem(action, onAction))

export const useHeaderMenuActions = (): {
    menuActions: AppHeaderMenuItem[]
    nativeMenuItems: (NativeStackHeaderItemMenuAction | NativeStackHeaderItemMenuSubmenu)[]
    onMenuAction: (id: string) => Promise<void>
} => {
    const { t } = useTranslation()
    const router = useRouter()
    const { user, logout, exitAnonymousMode } = useSession()
    const { changeLanguage } = useLanguage()
    const isLoggedIn = Boolean(user)

    const menuActions = useMemo(
        () =>
            buildNativeMenuActions({
                t,
                isLoggedIn,
                platform: Platform.OS === "android" ? "android" : "ios",
            }),
        [isLoggedIn, t],
    )

    const onMenuAction = useCallback(
        async (id: string): Promise<void> => {
            switch (id) {
                case NATIVE_MENU_ACTION_ID.privacy:
                    router.push("/privacy")
                    return
                case NATIVE_MENU_ACTION_ID.about:
                    router.push("/about")
                    return
                case NATIVE_MENU_ACTION_ID.games:
                    router.push("/games")
                    return
                case NATIVE_MENU_ACTION_ID.nerdStats:
                    router.push("/nerd-stats")
                    return
                case NATIVE_MENU_ACTION_ID.languageNo:
                    await changeLanguage("no")
                    return
                case NATIVE_MENU_ACTION_ID.languageEn:
                    await changeLanguage("en")
                    return
                case NATIVE_MENU_ACTION_ID.authLogout:
                    await logout()
                    return
                case NATIVE_MENU_ACTION_ID.authLogin:
                    await exitAnonymousMode()
                    router.replace("/login")
                    return
                default:
                    return
            }
        },
        [changeLanguage, exitAnonymousMode, logout, router],
    )

    const nativeMenuItems = useMemo(
        () =>
            toNativeMenuItems(menuActions, id => {
                void onMenuAction(id)
            }),
        [menuActions, onMenuAction],
    )

    return {
        menuActions,
        nativeMenuItems,
        onMenuAction,
    }
}
