import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { Text, View } from "react-native"
import { colors } from "../../constants/theme"
import { cn } from "../../utils/cn"
import { Input } from "../ui/input"

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"]

interface IconInputFieldProps extends React.ComponentProps<typeof Input> {
    iconName: MaterialIconName
    errorText?: string | null
    containerClassName?: string
    inputClassName?: string
}

export function IconInputField({
    iconName,
    errorText,
    containerClassName,
    inputClassName,
    className,
    ...props
}: IconInputFieldProps): React.JSX.Element {
    return (
        <View>
            <View
                className={cn(
                    "min-h-14 flex-row items-center gap-2.5 rounded-xl border border-surface bg-surface-muted px-3",
                    errorText && "border-danger-soft",
                    containerClassName,
                )}
            >
                <MaterialIcons name={iconName} size={20} color={colors.gray600} />
                <Input
                    className={cn(
                        "flex-1 border-0 bg-transparent px-0 py-3 text-base text-text-primary",
                        inputClassName,
                        className,
                    )}
                    {...props}
                />
            </View>
            {errorText ? (
                <Text className="mt-1.5 font-inter text-xs text-[#B91C1C]">{errorText}</Text>
            ) : null}
        </View>
    )
}
