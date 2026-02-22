import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Image, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { RootStackParamList } from "@/app/navigation/types"
import { Button } from "@/shared/ui/Button"
import { Text } from "@/shared/ui/Text"
import { StateSurface } from "@/shared/ui/Surface"
import { useNowPlayingScreenVM } from "@/features/now-playing/vm/useNowPlayingScreenVM"

export const KvarteretSkjermScreen = ({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "KvarteretSkjerm">): React.JSX.Element => {
    const { t } = useTranslation()
    const { state, actions } = useNowPlayingScreenVM()

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("kvarteretSkjerm") })
    }, [navigation, t])

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            <ScrollView className="flex-1" contentContainerClassName="flex-grow gap-3 p-4">
                {state.isPending ? (
                    <StateSurface>
                        <ActivityIndicator color="#000000" size="large" />
                        <Text className="text-base font-medium">{t("nowPlayingLoading")}</Text>
                    </StateSurface>
                ) : null}

                {state.errorMessage ? (
                    <StateSurface>
                        <Text className="text-base font-medium">{t("nowPlayingError")}</Text>
                        <Text className="text-sm text-text-secondary">{state.errorMessage}</Text>
                        <Button onPress={() => void actions.refresh()}>
                            <Text className="text-base leading-5 text-surface font-semibold">{t("nowPlayingRetry")}</Text>
                        </Button>
                    </StateSurface>
                ) : null}

                {state.showUnauthorized ? (
                    <StateSurface>
                        <Text className="text-base font-medium">{t("nowPlayingUnauthorized")}</Text>
                        <Button onPress={() => void actions.openSpotifyConnect()}>
                            <Text className="text-base leading-5 text-surface font-semibold">{t("nowPlayingConnect")}</Text>
                        </Button>
                    </StateSurface>
                ) : null}

                {state.showIdle ? (
                    <StateSurface>
                        <Text className="text-base font-medium">{t("nowPlayingIdle")}</Text>
                        <Button variant="secondary" onPress={() => void actions.refresh()}>
                            <Text className="text-base leading-5 text-text-primary font-semibold">
                                {t("nowPlayingRetry")}
                            </Text>
                        </Button>
                    </StateSurface>
                ) : null}

                {state.showPlaying ? (
                    <StateSurface className="flex-row items-center gap-3 p-3">
                        {state.nowPlaying?.image ? (
                            <Image className="h-24 w-24 rounded-lg" source={{ uri: state.nowPlaying.image }} />
                        ) : null}
                        <View className="flex-1 gap-2">
                            <Text className="text-lg font-semibold">{state.nowPlaying?.name ?? ""}</Text>
                            <Text className="text-sm text-text-secondary">
                                {state.nowPlaying?.artists ?? ""}
                                {state.nowPlaying?.album ? ` - ${state.nowPlaying.album}` : ""}
                            </Text>

                            <View className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                                <View className="h-full rounded-full bg-link" style={{ width: state.progressWidth }} />
                            </View>

                            <Text className="text-xs text-text-secondary">
                                {state.nowPlaying?.isPlaying ? t("nowPlayingPlaying") : t("nowPlayingPaused")}
                            </Text>
                        </View>
                    </StateSurface>
                ) : null}
            </ScrollView>
        </SafeAreaView>
    )
}
