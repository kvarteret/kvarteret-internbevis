import { MaterialIcons } from "@expo/vector-icons"
import { useIsFocused } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import React, { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { AppState, Image, Pressable, Text, View } from "react-native"
import { colors } from "../../constants/theme"
import { fetchNowPlaying } from "../../services/kvarteretSkjermService"
import { NowPlayingState } from "../../types/nowPlaying"
import { shouldShowNowPlayingWidget } from "./nowPlayingWidgetGuard"

const HOME_WIDGET_POLL_INTERVAL_MS = 15_000

interface GrondahlsWidgetProps {
    onPress: () => void
}

export function GrondahlsWidget({ onPress }: GrondahlsWidgetProps): React.JSX.Element | null {
    const { t } = useTranslation()
    const isFocused = useIsFocused()
    const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active")

    useEffect(() => {
        const subscription = AppState.addEventListener("change", nextState => {
            setIsAppActive(nextState === "active")
        })

        return () => {
            subscription.remove()
        }
    }, [])

    const queryEnabled = isFocused && isAppActive

    const { data: nowPlaying } = useQuery({
        queryKey: ["now-playing"],
        queryFn: ({ signal }) => fetchNowPlaying(signal),
        enabled: queryEnabled,
        refetchInterval: queryEnabled ? HOME_WIDGET_POLL_INTERVAL_MS : false,
        refetchIntervalInBackground: false,
        retry: 1,
    })

    if (!shouldShowNowPlayingWidget(nowPlaying)) {
        return null
    }

    const visibleNowPlaying = nowPlaying as NowPlayingState

    return (
        <Pressable
            className="w-full rounded-card border border-border bg-surface p-3"
            onPress={onPress}
        >
            <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-inter-bold text-base text-text-primary">
                    {t("kvarteretSkjerm")}
                </Text>
                <View className="flex-row items-center gap-1">
                    <Text className="font-inter-medium text-xs text-text-secondary">
                        {t("homeGrondahlsOpen")}
                    </Text>
                    <MaterialIcons name="chevron-right" color={colors.primaryText} size={18} />
                </View>
            </View>

            <View className="flex-row items-center gap-3">
                {visibleNowPlaying.image ? (
                    <Image
                        className="h-14 w-14 rounded-md"
                        source={{ uri: visibleNowPlaying.image }}
                    />
                ) : null}
                <View className="flex-1">
                    <Text
                        className="font-inter-semibold text-sm text-text-primary"
                        numberOfLines={1}
                    >
                        {visibleNowPlaying.name}
                    </Text>
                    <Text className="font-inter text-xs text-text-secondary" numberOfLines={1}>
                        {visibleNowPlaying.artists}
                    </Text>
                </View>
            </View>
        </Pressable>
    )
}
