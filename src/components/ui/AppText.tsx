import React from 'react';
import { StyleProp, Text, TextProps, TextStyle } from 'react-native';
import { styled } from 'nativewind';
import { getTypographyStyle, TextVariant } from '../../theme/typography';

const StyledText = styled(Text);

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  className?: string;
  style?: StyleProp<TextStyle>;
}

export function AppText({ variant = 'body', style, ...props }: AppTextProps): React.JSX.Element {
  return <StyledText {...props} style={[getTypographyStyle(variant), style]} />;
}
