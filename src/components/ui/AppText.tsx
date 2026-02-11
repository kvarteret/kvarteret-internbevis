import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { cssInterop } from 'nativewind';
import { getTypographyStyle, TextVariant } from '../../theme/typography';

const StyledText = cssInterop(Text, { className: 'style' });

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  className?: string;
  style?: StyleProp<TextStyle>;
}

export function AppText({ variant = 'body', style, ...props }: AppTextProps): React.JSX.Element {
  return <StyledText {...props} style={[getTypographyStyle(variant), style]} />;
}
