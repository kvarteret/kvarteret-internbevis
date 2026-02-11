import React from 'react';
import { View, ViewProps } from 'react-native';

export type BoxProps = ViewProps & {
  className?: string;
};

export function Box({ children, ...props }: BoxProps): React.JSX.Element {
  return <View {...props}>{children}</View>;
}
