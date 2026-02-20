import React from "react"
import { TextInput, TextInputProps } from "react-native"
import { colors } from "../../constants/theme"
import { cn } from "../../utils/cn"

interface InputProps extends TextInputProps {
    className?: string
}

export function Input({
    className,
    placeholderTextColor,
    ...props
}: InputProps): React.JSX.Element {
    return (
        <TextInput
            autoCorrect={false}
            className={cn(
                "min-h-12 w-full rounded-xl border border-surface bg-surface-muted px-3 py-3 font-inter text-base text-text-primary",
                className,
            )}
            placeholderTextColor={placeholderTextColor ?? colors.gray600}
            {...props}
        />
    )
}
