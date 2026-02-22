import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { RootStackParamList } from "@/app/navigation/types"
import { useGamesScreenVM } from "@/features/games/vm/useGamesScreenVM"
import { StateSurface } from "@/shared/ui/Surface"
import { Text } from "@/shared/ui/Text"

const formatClock = (milliseconds: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, "0")}`
}

const getWinnerLabelKey = (winner: "white" | "black"): "chessWhite" | "chessBlack" =>
    winner === "white" ? "chessWhite" : "chessBlack"

const getClockCardClass = (
    isActivePlayer: boolean,
    isRunning: boolean,
    hasWinner: boolean,
): string => {
    if (!isActivePlayer || hasWinner) {
        return "rounded-xl border border-border bg-surface-muted p-3.5"
    }

    if (isRunning) {
        return "rounded-xl border border-state-danger bg-state-danger p-3.5"
    }

    return "rounded-xl border border-state-danger bg-[#AA000073] p-3.5"
}

export const GamesScreen = ({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "Games">): React.JSX.Element => {
    const { t } = useTranslation()
    const { state, actions } = useGamesScreenVM()

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("gamesTitle") })
    }, [navigation, t])

    const winnerLabel = state.timerState.winner
        ? t("chessWinner", { winner: t(getWinnerLabelKey(state.timerState.winner)) })
        : null

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            <ScrollView className="flex-1" contentContainerClassName="flex-grow gap-4 p-4">
                <View className="flex-row gap-2.5">
                    <Pressable
                        className={[
                            "flex-1 items-center justify-center rounded-xl border px-3 py-3",
                            state.mode === "d6"
                                ? "border-text-primary bg-text-primary"
                                : "border-border bg-surface",
                        ].join(" ")}
                        onPress={() => actions.setMode("d6")}
                    >
                        <Text
                            className={
                                state.mode === "d6"
                                    ? "text-[15px] text-surface font-semibold"
                                    : "text-[15px] text-text-primary font-semibold"
                            }
                        >
                            {t("gamesDice")}
                        </Text>
                    </Pressable>

                    <Pressable
                        className={[
                            "flex-1 items-center justify-center rounded-xl border px-3 py-3",
                            state.mode === "chess"
                                ? "border-text-primary bg-text-primary"
                                : "border-border bg-surface",
                        ].join(" ")}
                        onPress={() => actions.setMode("chess")}
                    >
                        <Text
                            className={
                                state.mode === "chess"
                                    ? "text-[15px] text-surface font-semibold"
                                    : "text-[15px] text-text-primary font-semibold"
                            }
                        >
                            {t("gamesChessTimer")}
                        </Text>
                    </Pressable>
                </View>

                {state.mode === "d6" ? (
                    <StateSurface>
                        <Text className="text-2xl font-bold">{t("gamesDice")}</Text>
                        <Text className="text-center text-7xl font-bold">{state.diceValue}</Text>
                        <Text className="text-center text-sm text-text-secondary">
                            {t("gamesDiceRolls", { count: state.diceRollCount })}
                        </Text>

                        <Pressable
                            className="items-center rounded-xl border border-text-primary bg-text-primary py-3"
                            onPress={actions.rollDice}
                        >
                            <Text className="text-base text-surface font-bold">
                                {t("gamesRollD6")}
                            </Text>
                        </Pressable>
                    </StateSurface>
                ) : (
                    <StateSurface>
                        <Text className="text-2xl font-bold">{t("gamesChessTimer")}</Text>

                        <Pressable className="gap-3" onPress={actions.pressCurrentPlayer}>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-base text-text-secondary font-semibold">
                                    {t("chessTimeControl")}
                                </Text>
                                <Text className="text-base text-text-secondary font-semibold">
                                    {t("chessMoves", { count: state.timerState.moveCount })}
                                </Text>
                            </View>

                            <View
                                className={getClockCardClass(
                                    state.timerState.activePlayer === "white",
                                    state.timerState.isRunning,
                                    Boolean(state.timerState.winner),
                                )}
                            >
                                <Text
                                    className={
                                        state.timerState.activePlayer === "white"
                                            ? "mb-1.5 text-sm text-surface font-semibold"
                                            : "mb-1.5 text-sm text-text-secondary font-semibold"
                                    }
                                >
                                    {t("chessWhite")}
                                </Text>
                                <Text
                                    className={
                                        state.timerState.activePlayer === "white"
                                            ? "text-5xl text-surface font-bold"
                                            : "text-5xl text-text-primary font-bold"
                                    }
                                >
                                    {formatClock(state.timerState.whiteMs)}
                                </Text>
                            </View>

                            <View
                                className={getClockCardClass(
                                    state.timerState.activePlayer === "black",
                                    state.timerState.isRunning,
                                    Boolean(state.timerState.winner),
                                )}
                            >
                                <Text
                                    className={
                                        state.timerState.activePlayer === "black"
                                            ? "mb-1.5 text-sm text-surface font-semibold"
                                            : "mb-1.5 text-sm text-text-secondary font-semibold"
                                    }
                                >
                                    {t("chessBlack")}
                                </Text>
                                <Text
                                    className={
                                        state.timerState.activePlayer === "black"
                                            ? "text-5xl text-surface font-bold"
                                            : "text-5xl text-text-primary font-bold"
                                    }
                                >
                                    {formatClock(state.timerState.blackMs)}
                                </Text>
                            </View>

                            {winnerLabel ? (
                                <Text className="text-base text-[#0F766E] font-bold">
                                    {winnerLabel}
                                </Text>
                            ) : null}
                        </Pressable>

                        <View className="mt-1 gap-2.5">
                            <Pressable
                                className="items-center rounded-xl border border-text-primary bg-text-primary py-3"
                                onPress={actions.toggleTimer}
                            >
                                <Text className="text-base text-surface font-bold">
                                    {state.timerState.isRunning ? t("chessPause") : t("chessStart")}
                                </Text>
                            </Pressable>

                            <Pressable
                                className="items-center rounded-xl border border-border bg-surface py-3"
                                onPress={actions.resetTimer}
                            >
                                <Text className="text-base text-text-primary font-semibold">
                                    {t("chessReset")}
                                </Text>
                            </Pressable>
                        </View>
                    </StateSurface>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}
