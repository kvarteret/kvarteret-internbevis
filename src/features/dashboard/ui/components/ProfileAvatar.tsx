import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { Image, View } from "react-native"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { CachedImage } from "@/shared/ui/CachedImage"

interface ProfileAvatarProps {
    imageUrl?: string
    size: number
    iconSize: number
    borderClassName?: string
}

const localImageMap: Record<string, number> = {
    "assets/images/nils.jpg": require("@assets/images/nils.jpg"),
}

export const ProfileAvatar = ({
    imageUrl,
    size,
    iconSize,
    borderClassName = "",
}: ProfileAvatarProps): React.JSX.Element => {
    const { textSecondary } = useThemeRuntimeColors()
    const localImageSource = imageUrl ? localImageMap[imageUrl] : undefined
    const hasRemoteImage = Boolean(imageUrl && !localImageSource)
    const stableRecyclingKey =
        hasRemoteImage && imageUrl ? imageUrl.split("?")[0] : undefined

    return (
        <View
            className={`overflow-hidden rounded-full bg-surface-muted ${borderClassName}`}
            style={{ width: size, height: size }}
        >
            {localImageSource ? (
                <Image className="h-full w-full" resizeMode="cover" source={localImageSource} />
            ) : null}

            {!localImageSource && hasRemoteImage ? (
                <CachedImage
                    cachePolicy="memory-disk"
                    className="h-full w-full"
                    contentFit="cover"
                    recyclingKey={stableRecyclingKey}
                    source={imageUrl}
                />
            ) : null}

            {!localImageSource && !hasRemoteImage ? (
                <View className="h-full w-full items-center justify-center">
                    <MaterialIcons color={textSecondary} name="person" size={iconSize} />
                </View>
            ) : null}
        </View>
    )
}
