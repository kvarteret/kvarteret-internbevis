import React from "react"
import { View } from "react-native"
import { NowPlayingState } from "@/features/dashboard/data/nowPlayingRepository"
import { CachedImage } from "@/shared/ui/CachedImage"
import { Text } from "@/shared/ui/Text"

interface NowPlayingWidgetProps {
    nowPlaying: NowPlayingState
    progressWidth: `${number}%`
}

export const NowPlayingWidget = ({
    nowPlaying,
    progressWidth,
}: NowPlayingWidgetProps): React.JSX.Element => {
    return (
        <View className="w-full flex-row items-center gap-3 pt-3">
            {nowPlaying.image ? (
                <CachedImage
                    className="h-16 w-16 rounded-lg"
                    contentFit="cover"
                    source={nowPlaying.image}
                />
            ) : (
                <View className="h-16 w-16 rounded-lg bg-surface-muted" />
            )}
            <View className="flex-1 gap-1.5">
                <Text
                    className="text-base text-editorial-ink font-extrabold"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                >
                    {nowPlaying.name ?? "-"}
                </Text>
                <Text
                    className="text-sm text-editorial-ink-soft"
                    ellipsizeMode="tail"
                    numberOfLines={1}
                >
                    {nowPlaying.artists ?? "-"}
                    {nowPlaying.album ? ` - ${nowPlaying.album}` : ""}
                </Text>
                <View className="h-1.5 w-full overflow-hidden rounded-full bg-border-soft">
                    <View
                        className="h-full rounded-full bg-editorial-valid"
                        style={{ width: progressWidth }}
                    />
                </View>
            </View>
        </View>
    )
}
