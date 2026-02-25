import { useRouter } from "expo-router"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { TopShellHeader } from "@/features/dashboard/ui/components/TopShellHeader"
import {
    buildNativeMenuActions,
    NATIVE_MENU_ACTION_ID,
} from "@/features/dashboard/ui/menu/nativeMenuActions"

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
    const { changeLanguage } = useLanguage()

    const menuActions = useMemo(
        () =>
            buildNativeMenuActions({
                t,
                isLoggedIn,
            }),
        [isLoggedIn, t],
    )

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
                menuActions={menuActions}
                onMenuAction={id => {
                    void handleMenuAction(id)
                }}
            />

            {children}
        </SafeAreaView>
    )
}
