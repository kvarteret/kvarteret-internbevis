import React from "react"
import { Platform, StyleProp, StyleSheet, View, ViewProps, ViewStyle } from "react-native"
import { platformUi } from "../../constants/platformUi"
import { cn } from "../../utils/cn"

type NativeSurfaceVariant = "grouped" | "elevated"

interface NativeSurfaceProps extends ViewProps {
    variant?: NativeSurfaceVariant
    className?: string
    style?: StyleProp<ViewStyle>
}

const styles = StyleSheet.create({
    base: {
        borderRadius: platformUi.surfaceRadius,
        overflow: "hidden",
    },
    groupedIOS: {
        borderColor: "#D1D5DB",
        borderWidth: platformUi.surfaceBorderWidth,
        backgroundColor: "#FFFFFF",
    },
    groupedAndroid: {
        borderColor: "#D1D5DB",
        borderWidth: platformUi.surfaceBorderWidth,
        backgroundColor: "#FAFAFA",
        elevation: 1,
    },
    elevatedIOS: {
        borderColor: "#D1D5DB",
        borderWidth: platformUi.surfaceBorderWidth,
        backgroundColor: "#FFFFFF",
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    elevatedAndroid: {
        borderColor: "#D1D5DB",
        borderWidth: platformUi.surfaceBorderWidth,
        backgroundColor: "#FAFAFA",
        elevation: 2,
    },
})

function resolveVariantStyle(variant: NativeSurfaceVariant): ViewStyle {
    if (variant === "elevated") {
        return Platform.OS === "ios" ? styles.elevatedIOS : styles.elevatedAndroid
    }

    return Platform.OS === "ios" ? styles.groupedIOS : styles.groupedAndroid
}

export function NativeSurface({
    variant = "grouped",
    className,
    style,
    children,
    ...props
}: NativeSurfaceProps): React.JSX.Element {
    return (
        <View
            className={cn("bg-surface", className)}
            style={[styles.base, resolveVariantStyle(variant), style]}
            {...props}
        >
            {children}
        </View>
    )
}
