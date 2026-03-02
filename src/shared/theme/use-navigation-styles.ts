import { StyleProp, ViewStyle } from "react-native"
import { useResolveClassNames } from "uniwind"

export const useNavigationStyles = () => {
    const rootContentStyle = useResolveClassNames("bg-background") as StyleProp<ViewStyle>
    const androidHeaderStyle = useResolveClassNames(
        "bg-android-header-surface",
    ) as StyleProp<ViewStyle>

    return {
        rootContentStyle,
        androidHeaderStyle,
    }
}
