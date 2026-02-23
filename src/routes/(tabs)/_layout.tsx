import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Icon, Label, NativeTabs, VectorIcon } from "expo-router/unstable-native-tabs"
import React from "react"
import { themeColors } from "@/shared/theme/colors"

export default function TabsLayout(): React.JSX.Element {
    return (
        <NativeTabs
            backgroundColor={themeColors.background}
            indicatorColor={themeColors.tabActive}
            iconColor={{ default: themeColors.textSecondary, selected: themeColors.tabActive }}
            minimizeBehavior="never"
            rippleColor="rgba(127, 46, 46, 0.2)"
            shadowColor={themeColors.editorialBorder}
            tintColor={themeColors.tabActive}
            labelStyle={{
                fontSize: 10,
                fontWeight: "600",
            }}
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
