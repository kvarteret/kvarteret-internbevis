import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { getTypographyStyle, TextVariant } from '../../theme/typography';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  className?: string;
  style?: StyleProp<TextStyle>;
}

export function AppText({ variant = 'body', style, ...props }: AppTextProps): React.JSX.Element {
  return <Text {...props} style={[getTypographyStyle(variant), style]} />;
}
