import { NativeTabs } from "expo-router/unstable-native-tabs"
import React from "react"
import { Platform } from "react-native"
import { getIOSCapabilities } from "@/shared/platform/ios-version"
import { themeColors } from "@/shared/theme/colors"

export default function TabsLayout(): React.JSX.Element {
    const isAndroid = Platform.OS === "android"
    const { isLegacyIOS } = getIOSCapabilities()
    const useSolidTabBarBackground = isAndroid || isLegacyIOS
    const selectedTabContentColor = isAndroid ? themeColors.editorialInk : themeColors.tabActive
    const tabIndicatorColor = isAndroid ? themeColors.androidActionSurface : themeColors.tabActive

    return (
        <NativeTabs
            backgroundColor={useSolidTabBarBackground ? themeColors.background : undefined}
            blurEffect={useSolidTabBarBackground ? "none" : "systemMaterial"}
            disableTransparentOnScrollEdge={useSolidTabBarBackground}
            iconColor={{ default: themeColors.textSecondary, selected: selectedTabContentColor }}
            indicatorColor={tabIndicatorColor}
            labelStyle={
                isAndroid
                    ? {
                          default: { color: themeColors.textSecondary },
                          selected: { color: selectedTabContentColor },
                      }
                    : undefined
            }
            labelVisibilityMode={isAndroid ? "labeled" : undefined}
            rippleColor={isAndroid ? "rgba(17,24,39,0.14)" : undefined}
            tintColor={selectedTabContentColor}
        >
            <NativeTabs.Trigger disableTransparentOnScrollEdge={useSolidTabBarBackground} name="kontroll">
                <NativeTabs.Trigger.Icon md="person" sf="person" />
                <NativeTabs.Trigger.Label>Profil</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger
                disableTransparentOnScrollEdge={useSolidTabBarBackground}
                name="kvarteret"
            >
                <NativeTabs.Trigger.Icon md="home" sf="house.fill" />
                <NativeTabs.Trigger.Label>Kvarteret</NativeTabs.Trigger.Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    )
}
