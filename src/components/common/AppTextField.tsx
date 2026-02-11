import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { KeyboardTypeOptions, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../../constants/theme';

interface AppTextFieldProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  errorText?: string | null;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: KeyboardTypeOptions;
}

export function AppTextField({
  icon,
  placeholder,
  value,
  onChangeText,
  errorText,
  autoCapitalize = 'none',
  keyboardType = 'default',
}: AppTextFieldProps): React.JSX.Element {
  return (
    <View>
      <View style={[styles.inputWrapper, errorText ? styles.errorWrapper : null]}>
        <MaterialIcons name={icon} size={20} color={colors.gray600} />
        <TextInput
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={colors.gray600}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.white,
    backgroundColor: colors.gray200,
    minHeight: 52,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.primaryText,
    paddingVertical: 12,
  },
  errorWrapper: {
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#B91C1C',
    marginTop: 6,
    fontSize: 12,
  },
});
