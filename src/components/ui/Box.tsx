import React from 'react';
import { View, ViewProps } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);

export type BoxProps = ViewProps & {
  className?: string;
};

export function Box({ children, ...props }: BoxProps): React.JSX.Element {
  return <StyledView {...props}>{children}</StyledView>;
}
