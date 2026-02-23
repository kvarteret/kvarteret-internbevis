import React from "react"
import { TextInput, TextInputProps } from "react-native"
import { themeColors } from "@/shared/theme/colors"
import { cn } from "@/shared/utils/cn"

interface TextFieldProps extends TextInputProps {
    className?: string
}

export const TextField = ({
    className,
    placeholderTextColor,
    ...props
}: TextFieldProps): React.JSX.Element => {
    return (
        <TextInput
            autoCorrect={false}
            className={cn(
                "min-h-12 w-full rounded-xl border border-surface bg-surface-muted px-3 py-3 text-base text-text-primary",
                className,
            )}
            placeholderTextColor={placeholderTextColor ?? themeColors.textSecondary}
            {...props}
        />
    )
}
