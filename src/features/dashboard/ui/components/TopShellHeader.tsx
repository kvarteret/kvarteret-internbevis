import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, TouchableOpacity, View } from "react-native";
import { Card } from "@/shared/ui/Card";
import { themeColors } from "@/shared/theme/colors";
import { Text } from "@/shared/ui/Text";

interface TopShellHeaderProps {
  openMenuLabel: string;
  onOpenMenu: () => void;
}

export const TopShellHeader = ({
  openMenuLabel,
  onOpenMenu,
}: TopShellHeaderProps): React.JSX.Element => {
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

      <TouchableOpacity
        accessibilityLabel={openMenuLabel}
        className="items-end"
        hitSlop={8}
        onPress={onOpenMenu}
      >
        <Card
          className="h-10 w-10 items-center justify-center border border-editorial-border"
          effect="liquid"
          variant="grouped"
        >
          <MaterialIcons
            color={themeColors.editorialInk}
            name="menu"
            size={22}
          />
        </Card>
      </TouchableOpacity>
    </View>
  );
};
