import React from "react"
import { StyleProp, ViewStyle } from "react-native"
import { cn } from "../../utils/cn"
import { NativeSurface } from "./NativeSurface"

interface StateSurfaceProps extends React.ComponentProps<typeof NativeSurface> {
    className?: string
    style?: StyleProp<ViewStyle>
}

export function StateSurface({
    className,
    style,
    children,
    variant = "grouped",
    ...props
}: StateSurfaceProps): React.JSX.Element {
    return (
        <NativeSurface
            className={cn("gap-3 p-4", className)}
            style={style}
            variant={variant}
            {...props}
        >
            {children}
        </NativeSurface>
    )
}
