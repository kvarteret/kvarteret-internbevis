import React from "react"
import { View } from "react-native"

interface DashboardShellLayoutProps {
    children: React.ReactNode
}

export const DashboardShellLayout = ({
    children,
}: DashboardShellLayoutProps): React.JSX.Element => {
    return <View className="flex-1 bg-background">{children}</View>
}
