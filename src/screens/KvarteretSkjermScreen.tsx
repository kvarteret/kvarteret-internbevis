import { useIsFocused } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import React, { useCallback, useEffect, useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    AppState,
    DimensionValue,
    Image,
    ScrollView,
    Text,
    View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { StateSurface } from "../components/common/StateSurface"
import { Button } from "../components/ui/button"
import { colors } from "../constants/theme"
import { RootStackParamList } from "../navigation/types"
import { fetchNowPlaying } from "../services/kvarteretSkjermService"
import { tryOpenExternalUrl } from "../utils/externalLink"

const POLL_INTERVAL_MS = 1000

function clampProgress(value: number | null): number {
    if (value === null || !Number.isFinite(value)) {
        return 0
    }

    return Math.min(100, Math.max(0, value))
}

export function KvarteretSkjermScreen({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "KvarteretSkjerm">): React.JSX.Element {
    const { t } = useTranslation()
    const isFocused = useIsFocused()
    const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active")

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("kvarteretSkjerm") })
    }, [navigation, t])

    useEffect(() => {
        const subscription = AppState.addEventListener("change", nextState => {
            setIsAppActive(nextState === "active")
        })

        return () => {
            subscription.remove()
        }
    }, [])

    const queryEnabled = isFocused && isAppActive

    const {
        data: nowPlaying,
        error,
        isPending,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["now-playing"],
        queryFn: ({ signal }) => fetchNowPlaying(signal),
        enabled: queryEnabled,
        refetchInterval: queryEnabled ? POLL_INTERVAL_MS : false,
        refetchIntervalInBackground: false,
        retry: 1,
    })

    const errorMessage = isError ? (error instanceof Error ? error.message : String(error)) : null

    const progressWidth: DimensionValue = `${clampProgress(nowPlaying?.progressPercent ?? 0)}%`
    const hasData = Boolean(nowPlaying)
    const isAuthorized = Boolean(nowPlaying?.authorized)
    const isPlayingTrack = Boolean(nowPlaying?.playing)

    const showUnauthorized = !isPending && !isError && hasData && !isAuthorized
    const showIdle = !isPending && !isError && hasData && isAuthorized && !isPlayingTrack
    const showPlaying = !isPending && !isError && hasData && isAuthorized && isPlayingTrack

    const openSpotifyConnect = useCallback(async (): Promise<void> => {
        if (!nowPlaying?.connectUrl) {
            return
        }

        await tryOpenExternalUrl(nowPlaying.connectUrl)
    }, [nowPlaying?.connectUrl])

    const handleManualRefresh = useCallback((): void => {
        void refetch()
    }, [refetch])

    const handleOpenSpotifyConnect = useCallback((): void => {
        void openSpotifyConnect().catch(() => {
            // Query handles server-state errors; link open errors are intentionally ignored to keep UI simple.
        })
    }, [openSpotifyConnect])

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            <ScrollView className="flex-1" contentContainerClassName="flex-grow gap-3 p-4">
                {isPending ? (
                    <StateSurface>
                        <ActivityIndicator color={colors.primaryText} size="large" />
                        <Text className="font-inter-medium text-base text-text-primary">
                            {t("nowPlayingLoading")}
                        </Text>
                    </StateSurface>
                ) : null}

                {errorMessage ? (
                    <StateSurface>
                        <Text className="font-inter-medium text-base text-text-primary">
                            {t("nowPlayingError")}
                        </Text>
                        <Text className="font-inter text-sm text-text-secondary">
                            {errorMessage}
                        </Text>
                        <Button onPress={handleManualRefresh}>
                            <Text className="font-inter-semibold text-base leading-5 text-surface">
                                {t("nowPlayingRetry")}
                            </Text>
                        </Button>
                    </StateSurface>
                ) : null}

                {showUnauthorized ? (
                    <StateSurface>
                        <Text className="font-inter-medium text-base text-text-primary">
                            {t("nowPlayingUnauthorized")}
                        </Text>
                        <Button onPress={handleOpenSpotifyConnect}>
                            <Text className="font-inter-semibold text-base leading-5 text-surface">
                                {t("nowPlayingConnect")}
                            </Text>
                        </Button>
                    </StateSurface>
                ) : null}

                {showIdle ? (
                    <StateSurface>
                        <Text className="font-inter-medium text-base text-text-primary">
                            {t("nowPlayingIdle")}
                        </Text>
                        <Button variant="secondary" onPress={handleManualRefresh}>
                            <Text className="font-inter-semibold text-base leading-5 text-text-primary">
                                {t("nowPlayingRetry")}
                            </Text>
                        </Button>
                    </StateSurface>
                ) : null}

                {showPlaying ? (
                    <StateSurface className="flex-row items-center gap-3 p-3">
                        {nowPlaying.image ? (
                            <Image
                                className="h-24 w-24 rounded-lg"
                                source={{ uri: nowPlaying.image }}
                            />
                        ) : null}
                        <View className="flex-1 gap-2">
                            <Text className="font-inter-semibold text-lg text-text-primary">
                                {nowPlaying.name ?? ""}
                            </Text>
                            <Text className="font-inter text-sm text-text-secondary">
                                {nowPlaying.artists ?? ""}
                                {nowPlaying.album ? ` - ${nowPlaying.album}` : ""}
                            </Text>

                            <View className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                                <View
                                    className="h-full rounded-full bg-link"
                                    style={{ width: progressWidth }}
                                />
                            </View>

                            <Text className="font-inter text-xs text-text-secondary">
                                {nowPlaying.isPlaying
                                    ? t("nowPlayingPlaying")
                                    : t("nowPlayingPaused")}
                            </Text>
                        </View>
                    </StateSurface>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    )
}
