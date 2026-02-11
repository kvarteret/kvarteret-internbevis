import React from 'react';
import { View, ViewProps } from 'react-native';
import { cssInterop } from 'nativewind';

const StyledView = cssInterop(View, { className: 'style' });

export type BoxProps = ViewProps & {
  className?: string;
};

export function Box({ children, ...props }: BoxProps): React.JSX.Element {
  return <StyledView {...props}>{children}</StyledView>;
}
