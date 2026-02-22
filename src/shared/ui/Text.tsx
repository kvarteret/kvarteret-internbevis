import React from "react"
import { Text as RNText, TextProps } from "react-native"
import { cn } from "@/shared/utils/cn"

interface TextPropsExtended extends TextProps {
    className?: string
}

export const Text = ({ className, children, ...props }: TextPropsExtended): React.JSX.Element => (
    <RNText className={cn("text-text-primary", className)} {...props}>
        {children}
    </RNText>
)
