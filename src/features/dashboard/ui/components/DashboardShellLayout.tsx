import React from "react"
import { SafeAreaView } from "react-native-safe-area-context"

interface DashboardShellLayoutProps {
    children: React.ReactNode
}

export const DashboardShellLayout = ({ children }: DashboardShellLayoutProps): React.JSX.Element => {
    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            {children}
        </SafeAreaView>
    )
}
