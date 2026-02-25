import { MaterialIcons } from "@expo/vector-icons";
import { MenuAction, MenuView } from "@react-native-menu/menu";
import React from "react";
import {
  Image,
  Platform,
  PlatformColor,
  View,
} from "react-native";
import { themeColors } from "@/shared/theme/colors";
import { Text } from "@/shared/ui/Text";

interface TopShellHeaderProps {
  openMenuLabel: string;
  menuActions: MenuAction[];
  onMenuAction: (id: string) => void;
}

export const TopShellHeader = ({
  openMenuLabel,
  menuActions,
  onMenuAction,
}: TopShellHeaderProps): React.JSX.Element => {
  const nativeTriggerHitSlop = { top: 8, bottom: 8, left: 8, right: 8 };
  const iosMenuButtonStyle =
    Platform.OS === "ios"
      ? {
          backgroundColor: PlatformColor("secondarySystemFillColor"),
          borderColor: PlatformColor("separatorColor"),
        }
      : undefined;
  const menuIconColor =
    Platform.OS === "ios"
      ? PlatformColor("labelColor")
      : themeColors.editorialInk;

  const menuButton = (
    <View
      accessibilityLabel={openMenuLabel}
      accessibilityRole="button"
      accessible
      className={
        Platform.OS === "ios"
          ? "h-10 w-10 items-center justify-center rounded-full border"
          : "h-10 w-10 items-center justify-center rounded-full border border-editorial-border bg-surface-muted"
      }
      style={iosMenuButtonStyle}
    >
      <MaterialIcons color={menuIconColor} name="menu" size={22} />
    </View>
  );

  return (
    <View className="h-20 flex-row items-center px-4 pt-2">
      <View className="h-10 w-10 items-start justify-center">
        <Image
          resizeMode="contain"
          source={require("@assets/images/nobg.png")}
          style={{ width: 40, height: 26 }}
        />
      </View>

      <View className="flex-1 items-center px-2">
        <Text
          className="text-base font-extrabold text-editorial-ink uppercase"
          numberOfLines={1}
          style={{ letterSpacing: 2 }}
        >
          Det Akademiske Kvarter
        </Text>
      </View>

      <View className="items-end">
        <MenuView
          actions={menuActions}
          hitSlop={nativeTriggerHitSlop}
          shouldOpenOnLongPress={false}
          title=""
          {...(Platform.OS === "android" ? { isAnchoredToRight: true } : {})}
          onPressAction={({ nativeEvent }) => onMenuAction(nativeEvent.event)}
        >
          {menuButton}
        </MenuView>
      </View>
    </View>
  );
};
