import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Icon, Label, NativeTabs, VectorIcon } from "expo-router/unstable-native-tabs"
import React from "react"
import { Platform } from "react-native"
import { themeColors } from "@/shared/theme/colors"

const IOS_SCROLL_EDGE_VERSION = 26

const getMajorIOSVersion = (): number | null => {
    if (Platform.OS !== "ios") return null

    if (typeof Platform.Version === "number") {
        return Number.isFinite(Platform.Version) ? Math.trunc(Platform.Version) : null
    }

    if (typeof Platform.Version === "string") {
        const [major = ""] = Platform.Version.split(".")
        const parsed = Number.parseInt(major, 10)
        return Number.isFinite(parsed) ? parsed : null
    }

    return null
}

export default function TabsLayout(): React.JSX.Element {
    const isAndroid = Platform.OS === "android"
    const isLegacyIOS =
        Platform.OS === "ios" &&
        (() => {
            const major = getMajorIOSVersion()
            return major !== null && major < IOS_SCROLL_EDGE_VERSION
        })()
    const useSolidTabBarBackground = isAndroid || isLegacyIOS
    const selectedTabContentColor = isAndroid ? themeColors.editorialInk : themeColors.tabActive
    const tabIndicatorColor = isAndroid ? themeColors.androidActionSurface : themeColors.tabActive

    return (
        <NativeTabs
            backgroundColor={useSolidTabBarBackground ? themeColors.background : null}
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
            <NativeTabs.Trigger name="kontroll">
                <Icon src={<VectorIcon family={MaterialIcons} name="person" />} />
                <Label>Profil</Label>
            </NativeTabs.Trigger>

            <NativeTabs.Trigger name="kvarteret">
                <Icon src={<VectorIcon family={MaterialIcons} name="home" />} />
                <Label>Kvarteret</Label>
            </NativeTabs.Trigger>
        </NativeTabs>
    )
}
