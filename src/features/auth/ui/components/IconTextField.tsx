import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { View } from "react-native"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { Text } from "@/shared/ui/Text"
import { TextField } from "@/shared/ui/TextField"
import { cn } from "@/shared/utils/cn"

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"]

interface IconTextFieldProps extends React.ComponentProps<typeof TextField> {
    iconName: MaterialIconName
    errorText?: string | null
    containerClassName?: string
    inputClassName?: string
}

export const IconTextField = ({
    iconName,
    errorText,
    containerClassName,
    inputClassName,
    className,
    ...props
}: IconTextFieldProps): React.JSX.Element => {
    const { textSecondary } = useThemeRuntimeColors()

    return (
        <View>
            <View
                className={cn(
                    "min-h-14 flex-row items-center gap-2.5 rounded-xl border border-surface bg-surface-muted px-3",
                    errorText && "border-state-danger",
                    containerClassName,
                )}
            >
                <MaterialIcons name={iconName} size={20} color={textSecondary} />
                <TextField
                    className={cn(
                        "flex-1 border-0 bg-transparent px-0 py-3 text-base text-text-primary",
                        inputClassName,
                        className,
                    )}
                    {...props}
                />
            </View>
            {errorText ? (
                <Text className="mt-1.5 text-xs text-state-danger">{errorText}</Text>
            ) : null}
        </View>
    )
}
