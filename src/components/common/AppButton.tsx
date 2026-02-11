import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

interface AppButtonProps {
  text: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({ text, onPress, secondary = false, disabled = false, style }: AppButtonProps): React.JSX.Element {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        secondary ? styles.secondaryButton : styles.primaryButton,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <Text style={[styles.text, secondary ? styles.secondaryText : styles.primaryText]}>{text}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 50,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primaryText,
  },
  secondaryButton: {
    backgroundColor: colors.gray300,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.primaryText,
  },
  disabled: {
    opacity: 0.65,
  },
});
