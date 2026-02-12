import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { KeyboardTypeOptions, Text, TextInput, View } from "react-native";
import { colors } from "../../constants/theme";

interface AppTextFieldProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  errorText?: string | null;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: KeyboardTypeOptions;
}

export function AppTextField({
  icon,
  placeholder,
  value,
  onChangeText,
  errorText,
  autoCapitalize = "none",
  keyboardType = "default",
}: AppTextFieldProps): React.JSX.Element {
  return (
    <View>
      <View
        className={[
          "min-h-14 flex-row items-center gap-2.5 rounded-xl border border-surface bg-surface-muted px-3",
          errorText ? "border-danger-soft" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <MaterialIcons name={icon} size={20} color={colors.gray600} />
        <TextInput
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          className="flex-1 py-3 font-inter text-base text-text-primary"
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={colors.gray600}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
      {errorText ? <Text className="mt-1.5 font-inter text-xs text-[#B91C1C]">{errorText}</Text> : null}
    </View>
  );
}
