import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Icon, Label, NativeTabs, VectorIcon } from "expo-router/unstable-native-tabs"
import React from "react"
import { Platform } from "react-native"
import { themeColors } from "@/shared/theme/colors"

export default function TabsLayout(): React.JSX.Element {
    const isAndroid = Platform.OS === "android"
    const selectedTabContentColor = isAndroid ? themeColors.background : themeColors.tabActive

    return (
        <NativeTabs
            iconColor={{ default: themeColors.textSecondary, selected: selectedTabContentColor }}
            indicatorColor={themeColors.tabActive}
            labelStyle={
                isAndroid
                    ? {
                          default: { color: themeColors.textSecondary },
                          selected: { color: selectedTabContentColor },
                      }
                    : undefined
            }
            tintColor={selectedTabContentColor}
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
