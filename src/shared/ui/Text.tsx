import React from "react"
import { StyleProp, Text as RNText, TextProps, TextStyle } from "react-native"
import { cn } from "@/shared/utils/cn"

interface TextPropsExtended extends TextProps {
    className?: string
    style?: StyleProp<TextStyle>
}

export const Text = ({ className, children, style, ...props }: TextPropsExtended): React.JSX.Element => (
    <RNText className={cn("text-text-primary", className)} style={style} {...props}>
        {children}
    </RNText>
)
