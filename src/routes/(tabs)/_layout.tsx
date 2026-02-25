import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Icon, Label, NativeTabs, VectorIcon } from "expo-router/unstable-native-tabs"
import React from "react"
import { themeColors } from "@/shared/theme/colors"

export default function TabsLayout(): React.JSX.Element {
    return (
        <NativeTabs
            iconColor={{ default: themeColors.textSecondary, selected: themeColors.tabActive }}
            indicatorColor={themeColors.tabActive}
            tintColor={themeColors.tabActive}
        >
            <NativeTabs.Trigger name="kontroll">
                <Icon src={<VectorIcon family={MaterialIcons} name="person" />} />
                <Label>Kontroll</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="kvarteret">
                <Icon src={<VectorIcon family={MaterialIcons} name="home" />} />
                <Label>Kvarteret</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    )
}
