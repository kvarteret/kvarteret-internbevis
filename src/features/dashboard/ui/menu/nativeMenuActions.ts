import { AppHeaderMenuItem } from "@/features/dashboard/ui/menu/headerMenu.types"

export const NATIVE_MENU_ACTION_ID = {
    privacy: "privacy",
    about: "about",
    feedback: "feedback",
    benefits: "benefits",
    nerdStats: "nerd_stats",
    authLogin: "auth_login",
    authLogout: "auth_logout",
    languageNo: "language_no",
    languageEn: "language_en",
} as const

interface BuildNativeMenuActionsParams {
    t: (key: string) => string
    isLoggedIn: boolean
    isVolunteer: boolean
    platform: "ios" | "android"
}

export const buildNativeMenuActions = ({
    t,
    isLoggedIn,
    isVolunteer,
    platform,
}: BuildNativeMenuActionsParams): AppHeaderMenuItem[] => {
    const menuImage = ({ ios }: { ios: string }): string | undefined =>
        process.env.EXPO_OS === "ios" ? ios : undefined

    const languageSubactions: AppHeaderMenuItem[] = [
        {
            id: NATIVE_MENU_ACTION_ID.languageNo,
            title: "Norsk",
        },
        {
            id: NATIVE_MENU_ACTION_ID.languageEn,
            title: "English",
        },
    ]

    const authAction: AppHeaderMenuItem = isLoggedIn
        ? {
              id: NATIVE_MENU_ACTION_ID.authLogout,
              title: t("logout"),
              attributes: {
                  destructive: true,
              },
              image: menuImage({
                  ios: "rectangle.portrait.and.arrow.right.fill",
              }),
              imageColor: "#D70015",
          }
        : {
              id: NATIVE_MENU_ACTION_ID.authLogin,
              title: t("login"),
              image: menuImage({
                  ios: "person.crop.circle",
              }),
              imageColor: "#111827",
          }

    const actions: AppHeaderMenuItem[] = [
        {
            id: NATIVE_MENU_ACTION_ID.privacy,
            title: t("privacy"),
            image: menuImage({
                ios: "lock.fill",
            }),
            imageColor: "#111827",
        },
        {
            id: NATIVE_MENU_ACTION_ID.about,
            title: t("about"),
            image: menuImage({
                ios: "info.circle",
            }),
            imageColor: "#111827",
        },
        {
            id: NATIVE_MENU_ACTION_ID.feedback,
            title: t("feedback"),
            image: menuImage({
                ios: "bubble.left.and.bubble.right",
            }),
            imageColor: "#111827",
        },
        ...(isVolunteer
            ? [
                  {
                      id: NATIVE_MENU_ACTION_ID.benefits,
                      title: t("benefits"),
                      image: menuImage({
                          ios: "star.fill",
                      }),
                      imageColor: "#111827",
                  } satisfies AppHeaderMenuItem,
              ]
            : []),
        {
            id: "language",
            title: t("language"),
            subactions: languageSubactions,
            displayInline: true,
        },
        authAction,
    ]

    if (platform === "android") {
        actions.splice(3, 0, {
            id: NATIVE_MENU_ACTION_ID.nerdStats,
            title: t("nerdStats"),
        })
    }

    return actions
}
