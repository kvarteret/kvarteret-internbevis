import { useFocusEffect } from "@react-navigation/native"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import React, { useCallback, useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, AppState, Image, Linking, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Text } from "@/components/ui/text"
import { RootStackParamList } from "../navigation/types"
import { fetchNowPlaying } from "../services/kvarteretSkjermService"

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
    const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active")

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("kvarteretSkjerm") })
    }, [navigation, t])

    useFocusEffect(
        useCallback(() => {
            const subscription = AppState.addEventListener("change", nextState => {
                setIsAppActive(nextState === "active")
            })

            return () => {
                subscription.remove()
            }
        }, []),
    )

    const queryEnabled = isAppActive

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

        await Linking.openURL(nowPlaying.connectUrl)
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
                    <Card className="gap-3 p-4">
                        <ActivityIndicator color="#111827" size="large" />
                        <Text className="font-inter-medium text-base text-foreground">
                            {t("nowPlayingLoading")}
                        </Text>
                    </Card>
                ) : null}

                {errorMessage ? (
                    <Card className="gap-3 p-4">
                        <Text className="font-inter-medium text-base text-foreground">
                            {t("nowPlayingError")}
                        </Text>
                        <Text className="font-inter text-sm text-muted-foreground">
                            {errorMessage}
                        </Text>
                        <Button className="h-12 rounded-xl" onPress={handleManualRefresh}>
                            <Text className="font-inter-semibold text-base leading-5">
                                {t("nowPlayingRetry")}
                            </Text>
                        </Button>
                    </Card>
                ) : null}

                {showUnauthorized ? (
                    <Card className="gap-3 p-4">
                        <Text className="font-inter-medium text-base text-foreground">
                            {t("nowPlayingUnauthorized")}
                        </Text>
                        <Button className="h-12 rounded-xl" onPress={handleOpenSpotifyConnect}>
                            <Text className="font-inter-semibold text-base leading-5">
                                {t("nowPlayingConnect")}
                            </Text>
                        </Button>
                    </Card>
                ) : null}

                {showIdle ? (
                    <Card className="gap-3 p-4">
                        <Text className="font-inter-medium text-base text-foreground">
                            {t("nowPlayingIdle")}
                        </Text>
                        <Button
                            className="h-12 rounded-xl"
                            variant="outline"
                            onPress={handleManualRefresh}
                        >
                            <Text className="font-inter-semibold text-base leading-5 text-foreground">
                                {t("nowPlayingRetry")}
                            </Text>
                        </Button>
                    </Card>
                ) : null}

                {showPlaying ? (
                    <Card className="flex-row items-center gap-3 p-3">
                        {nowPlaying.image ? (
                            <Image
                                className="h-24 w-24 rounded-lg"
                                source={{ uri: nowPlaying.image }}
                            />
                        ) : null}
                        <View className="flex-1 gap-2">
                            <Text className="font-inter-semibold text-lg text-foreground">
                                {nowPlaying.name ?? ""}
                            </Text>
                            <Text className="font-inter text-sm text-muted-foreground">
                                {nowPlaying.artists ?? ""}
                                {nowPlaying.album ? ` - ${nowPlaying.album}` : ""}
                            </Text>

                            <Progress
                                className="h-2 w-full"
                                indicatorClassName="bg-accent"
                                value={clampProgress(nowPlaying?.progressPercent ?? 0)}
                            />

                            <Text className="font-inter text-xs text-muted-foreground">
                                {nowPlaying.isPlaying
                                    ? t("nowPlayingPlaying")
                                    : t("nowPlayingPaused")}
                            </Text>
                        </View>
                    </Card>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    )
}
