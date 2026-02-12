import React from "react";
import { Text, TouchableOpacity } from "react-native";

interface AppButtonProps {
  text: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

export function AppButton({
  text,
  onPress,
  secondary = false,
  disabled = false,
  className,
  textClassName,
}: AppButtonProps): React.JSX.Element {
  const containerClassName = [
    "h-12 w-full items-center justify-center rounded-xl border",
    secondary ? "border-border bg-surface" : "border-text-primary bg-text-primary",
    disabled ? "opacity-65" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const labelClassName = [
    "font-inter-semibold text-base leading-5",
    secondary ? "text-text-primary" : "text-surface",
    textClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <TouchableOpacity accessibilityRole="button" className={containerClassName} disabled={disabled} onPress={onPress}>
      <Text className={labelClassName}>{text}</Text>
    </TouchableOpacity>
  );
}
