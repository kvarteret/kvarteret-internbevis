import { MenuAction } from "@react-native-menu/menu"
import { Platform } from "react-native"

export const NATIVE_MENU_ACTION_ID = {
    privacy: "privacy",
    about: "about",
    games: "games",
    authLogin: "auth_login",
    authLogout: "auth_logout",
    languageNo: "language_no",
    languageEn: "language_en",
} as const

interface BuildNativeMenuActionsParams {
    t: (key: string) => string
    isLoggedIn: boolean
}

export const buildNativeMenuActions = ({
    t,
    isLoggedIn,
}: BuildNativeMenuActionsParams): MenuAction[] => {
    const menuImage = ({ ios, android }: { ios: string; android: string }): string | undefined => {
        if (Platform.OS === "ios") return ios
        if (Platform.OS === "android") return android
        return undefined
    }

    const languageSubactions: MenuAction[] = [
        {
            id: NATIVE_MENU_ACTION_ID.languageNo,
            title: "Norsk",
        },
        {
            id: NATIVE_MENU_ACTION_ID.languageEn,
            title: "English",
        },
    ]

    const authAction: MenuAction = isLoggedIn
        ? {
              id: NATIVE_MENU_ACTION_ID.authLogout,
              title: t("logout"),
              attributes: {
                  destructive: true,
              },
              image: menuImage({
                  ios: "rectangle.portrait.and.arrow.right.fill",
                  android: "ic_menu_close_clear_cancel",
              }),
              imageColor: "#D70015",
          }
        : {
              id: NATIVE_MENU_ACTION_ID.authLogin,
              title: t("login"),
              image: menuImage({
                  ios: "person.crop.circle",
                  android: "ic_menu_myplaces",
              }),
              imageColor: "#111827",
          }

    return [
        {
            id: NATIVE_MENU_ACTION_ID.privacy,
            title: t("privacy"),
            image: menuImage({
                ios: "lock.fill",
                android: "ic_menu_info_details",
            }),
            imageColor: "#111827",
        },
        {
            id: NATIVE_MENU_ACTION_ID.about,
            title: t("about"),
            image: menuImage({
                ios: "info.circle",
                android: "ic_menu_help",
            }),
            imageColor: "#111827",
        },
        {
            id: NATIVE_MENU_ACTION_ID.games,
            title: t("games"),
            image: menuImage({
                ios: "gamecontroller.fill",
                android: "ic_menu_manage",
            }),
            imageColor: "#111827",
        },
        {
            id: "language",
            title: t("language"),
            subactions: languageSubactions,
            displayInline: true,
        },
        authAction,
    ]
}
