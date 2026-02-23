import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Icon, Label, NativeTabs, VectorIcon } from "expo-router/unstable-native-tabs"
import React from "react"

export default function TabsLayout(): React.JSX.Element {
    return (
        <NativeTabs
            backgroundColor="#F3E2CC"
            iconColor={{ default: "#374151", selected: "#0F766E" }}
            minimizeBehavior="never"
            labelStyle={{
                fontSize: 11,
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
