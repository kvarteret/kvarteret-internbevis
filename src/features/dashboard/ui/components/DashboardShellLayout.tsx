import { useRouter } from "expo-router"
import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { MenuSheet } from "@/features/dashboard/ui/components/MenuSheet"
import { TopShellHeader } from "@/features/dashboard/ui/components/TopShellHeader"
import {
    buildNativeMenuActions,
    NATIVE_MENU_ACTION_ID,
} from "@/features/dashboard/ui/menu/nativeMenuActions"
import { LanguageSelectorModal } from "@/shared/ui/LanguageSelectorModal"

interface DashboardShellLayoutProps {
    children: React.ReactNode
    isLoggedIn: boolean
    onLogin: () => Promise<void>
    onLogout: () => Promise<void>
}

export const DashboardShellLayout = ({
    children,
    isLoggedIn,
    onLogin,
    onLogout,
}: DashboardShellLayoutProps): React.JSX.Element => {
    const { t } = useTranslation()
    const router = useRouter()
    const { language, changeLanguage } = useLanguage()
    const useWebMenuFallback = Platform.OS === "web"

    const [menuVisible, setMenuVisible] = useState(false)
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)

    const menuActions = useMemo(
        () =>
            buildNativeMenuActions({
                t,
                isLoggedIn,
            }),
        [isLoggedIn, t],
    )

    const authAction: React.ComponentProps<typeof MenuSheet>["authAction"] = isLoggedIn
        ? {
              label: t("logout"),
              icon: "logout",
              destructive: true,
              onPress: () => void onLogout(),
          }
        : {
              label: t("login"),
              icon: "login",
              onPress: () => void onLogin(),
          }

    const handleMenuAction = async (id: string): Promise<void> => {
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
            case NATIVE_MENU_ACTION_ID.languageNo:
                await changeLanguage("no")
                return
            case NATIVE_MENU_ACTION_ID.languageEn:
                await changeLanguage("en")
                return
            case NATIVE_MENU_ACTION_ID.authLogout:
                await onLogout()
                return
            case NATIVE_MENU_ACTION_ID.authLogin:
                await onLogin()
                return
            default:
                return
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <TopShellHeader
                openMenuLabel={t("openMenu")}
                onOpenMenu={() => {
                    if (useWebMenuFallback) {
                        setMenuVisible(true)
                    }
                }}
                menuActions={menuActions}
                onMenuAction={id => {
                    void handleMenuAction(id)
                }}
            />

            {children}

            {useWebMenuFallback ? (
                <>
                    <MenuSheet
                        visible={menuVisible}
                        onClose={() => setMenuVisible(false)}
                        onOpenLanguage={() => setLanguageSelectorVisible(true)}
                        onOpenGames={() => router.push("/games")}
                        onOpenPrivacy={() => router.push("/privacy")}
                        onOpenAbout={() => router.push("/about")}
                        authAction={authAction}
                    />

                    <LanguageSelectorModal
                        visible={languageSelectorVisible}
                        onClose={() => setLanguageSelectorVisible(false)}
                    />
                </>
            ) : null}
        </SafeAreaView>
    )
}
