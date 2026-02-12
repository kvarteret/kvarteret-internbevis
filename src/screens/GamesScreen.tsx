import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { AppState, Pressable, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Text } from "@/components/ui/text"
import { RootStackParamList } from "../navigation/types"
import {
    ChessPlayer,
    ChessTimerState,
    completeMove,
    pause,
    resetTimer,
    selectActivePlayer,
    tick,
    toggleStartPause,
} from "../utils/chessTimer"

type GameMode = "d6" | "chess"

const INITIAL_CHESS_MS = 15 * 60 * 1000
const INCREMENT_MS = 2 * 1000
const TIMER_POLL_INTERVAL_MS = 200

function formatClock(milliseconds: number): string {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function rollD6(): number {
    return Math.floor(Math.random() * 6) + 1
}

function getWinnerLabelKey(winner: ChessPlayer): "chessWhite" | "chessBlack" {
    return winner === "white" ? "chessWhite" : "chessBlack"
}

function getClockCardClass(state: ChessTimerState, player: ChessPlayer): string {
    const isActivePlayer = state.activePlayer === player

    if (!isActivePlayer || state.winner) {
        return "rounded-xl border border-border bg-muted p-3.5"
    }

    if (state.isRunning) {
        return "rounded-xl border border-destructive bg-destructive p-3.5"
    }

    return "rounded-xl border border-destructive bg-destructive/40 p-3.5"
}

function getClockLabelClass(state: ChessTimerState, player: ChessPlayer): string {
    const isActivePlayer = state.activePlayer === player
    const isHighlighted = isActivePlayer && (state.isRunning || !state.winner)

    return [
        "mb-1.5 font-inter-semibold text-sm",
        isHighlighted ? "text-primary-foreground" : "text-muted-foreground",
    ].join(" ")
}

function getClockValueClass(state: ChessTimerState, player: ChessPlayer): string {
    const isActivePlayer = state.activePlayer === player
    const isHighlighted = isActivePlayer && (state.isRunning || !state.winner)

    return [
        "font-inter-bold text-5xl",
        isHighlighted ? "text-primary-foreground" : "text-foreground",
    ].join(" ")
}

export function GamesScreen({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "Games">): React.JSX.Element {
    const { t } = useTranslation()
    const [mode, setMode] = useState<GameMode>("d6")

    const [diceValue, setDiceValue] = useState(1)
    const [diceRollCount, setDiceRollCount] = useState(0)

    const [timerState, setTimerState] = useState<ChessTimerState>(() =>
        resetTimer(INITIAL_CHESS_MS, INCREMENT_MS),
    )

    const timerStateRef = useRef(timerState)
    const lastTickAtRef = useRef<number | null>(null)

    useEffect(() => {
        timerStateRef.current = timerState
    }, [timerState])

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("gamesTitle") })
    }, [navigation, t])

    const applyElapsed = useCallback((now: number): void => {
        setTimerState(previous => {
            if (!previous.isRunning || previous.winner) {
                return previous
            }

            const lastTickAt = lastTickAtRef.current ?? now
            const elapsed = Math.max(0, now - lastTickAt)
            lastTickAtRef.current = now

            if (elapsed === 0) {
                return previous
            }

            return tick(previous, elapsed)
        })
    }, [])

    const pauseWithElapsed = useCallback((): void => {
        const now = Date.now()
        setTimerState(previous => {
            if (!previous.isRunning || previous.winner) {
                return previous
            }

            const lastTickAt = lastTickAtRef.current ?? now
            const elapsed = Math.max(0, now - lastTickAt)
            const next = elapsed > 0 ? tick(previous, elapsed) : previous
            return pause(next)
        })
        lastTickAtRef.current = null
    }, [])

    useEffect(() => {
        if (!timerState.isRunning || timerState.winner) {
            lastTickAtRef.current = null
            return
        }

        lastTickAtRef.current = Date.now()

        const timer = setInterval(() => {
            applyElapsed(Date.now())
        }, TIMER_POLL_INTERVAL_MS)

        return () => {
            clearInterval(timer)
        }
    }, [applyElapsed, timerState.isRunning, timerState.winner])

    useEffect(() => {
        const subscription = AppState.addEventListener("change", nextState => {
            if (nextState !== "active" && timerStateRef.current.isRunning) {
                pauseWithElapsed()
            }

            if (nextState === "active") {
                lastTickAtRef.current = null
            }
        })

        return () => {
            subscription.remove()
        }
    }, [pauseWithElapsed])

    const handleRollDice = (): void => {
        setDiceValue(rollD6())
        setDiceRollCount(previous => previous + 1)
    }

    const handleToggleTimer = (): void => {
        if (timerState.winner) {
            setTimerState(resetTimer(INITIAL_CHESS_MS, INCREMENT_MS))
            lastTickAtRef.current = null
            return
        }

        if (timerState.isRunning) {
            pauseWithElapsed()
            return
        }

        lastTickAtRef.current = Date.now()
        setTimerState(previous => toggleStartPause(previous))
    }

    const handleResetTimer = (): void => {
        setTimerState(resetTimer(INITIAL_CHESS_MS, INCREMENT_MS))
        lastTickAtRef.current = null
    }

    const handlePressPlayer = (player: ChessPlayer): void => {
        setTimerState(previous => {
            if (previous.winner) {
                return previous
            }

            if (!previous.isRunning) {
                return selectActivePlayer(previous, player)
            }

            if (player !== previous.activePlayer) {
                return previous
            }

            const now = Date.now()
            const lastTickAt = lastTickAtRef.current ?? now
            const elapsed = Math.max(0, now - lastTickAt)
            const withElapsed = elapsed > 0 ? tick(previous, elapsed) : previous

            if (withElapsed.winner || !withElapsed.isRunning) {
                lastTickAtRef.current = null
                return withElapsed
            }

            const moved = completeMove(withElapsed)
            lastTickAtRef.current = now
            return moved
        })
    }

    const winnerLabel = timerState.winner
        ? t("chessWinner", { winner: t(getWinnerLabelKey(timerState.winner)) })
        : null

    const handleChessBoxTap = (): void => {
        void handlePressPlayer(timerState.activePlayer)
    }

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            <ScrollView className="flex-1" contentContainerClassName="flex-grow gap-4 p-4">
                <View className="flex-row gap-2.5">
                    <Button
                        className="flex-1 rounded-xl border px-3 py-3"
                        variant={mode === "d6" ? "default" : "outline"}
                        onPress={() => setMode("d6")}
                    >
                        <Text
                            className={
                                mode === "d6"
                                    ? "font-inter-semibold text-[15px] text-primary-foreground"
                                    : "font-inter-semibold text-[15px] text-foreground"
                            }
                        >
                            {t("gamesDice")}
                        </Text>
                    </Button>

                    <Button
                        className="flex-1 rounded-xl border px-3 py-3"
                        variant={mode === "chess" ? "default" : "outline"}
                        onPress={() => setMode("chess")}
                    >
                        <Text
                            className={
                                mode === "chess"
                                    ? "font-inter-semibold text-[15px] text-primary-foreground"
                                    : "font-inter-semibold text-[15px] text-foreground"
                            }
                        >
                            {t("gamesChessTimer")}
                        </Text>
                    </Button>
                </View>

                {mode === "d6" ? (
                    <Card className="gap-3 p-4">
                        <Text className="font-inter-bold text-2xl text-foreground">
                            {t("gamesDice")}
                        </Text>
                        <Text className="text-center font-inter-bold text-7xl text-foreground">
                            {diceValue}
                        </Text>
                        <Text className="text-center font-inter text-sm text-muted-foreground">
                            {t("gamesDiceRolls", { count: diceRollCount })}
                        </Text>

                        <Button className="h-12 rounded-xl" onPress={handleRollDice}>
                            <Text className="font-inter-bold text-base text-primary-foreground">
                                {t("gamesRollD6")}
                            </Text>
                        </Button>
                    </Card>
                ) : (
                    <Card className="gap-3 p-4">
                        <Text className="font-inter-bold text-2xl text-foreground">
                            {t("gamesChessTimer")}
                        </Text>

                        <Pressable className="gap-3" onPress={handleChessBoxTap}>
                            <View className="flex-row items-center justify-between">
                                <Text className="font-inter-semibold text-base text-muted-foreground">
                                    {t("chessTimeControl")}
                                </Text>
                                <Text className="font-inter-semibold text-base text-muted-foreground">
                                    {t("chessMoves", { count: timerState.moveCount })}
                                </Text>
                            </View>

                            <View className={getClockCardClass(timerState, "white")}>
                                <Text className={getClockLabelClass(timerState, "white")}>
                                    {t("chessWhite")}
                                </Text>
                                <Text className={getClockValueClass(timerState, "white")}>
                                    {formatClock(timerState.whiteMs)}
                                </Text>
                            </View>

                            <View className={getClockCardClass(timerState, "black")}>
                                <Text className={getClockLabelClass(timerState, "black")}>
                                    {t("chessBlack")}
                                </Text>
                                <Text className={getClockValueClass(timerState, "black")}>
                                    {formatClock(timerState.blackMs)}
                                </Text>
                            </View>

                            {winnerLabel ? (
                                <Text className="font-inter-bold text-base text-secondary">
                                    {winnerLabel}
                                </Text>
                            ) : null}
                        </Pressable>

                        <View className="mt-1 gap-2.5">
                            <Button className="h-12 rounded-xl" onPress={handleToggleTimer}>
                                <Text className="font-inter-bold text-base text-primary-foreground">
                                    {timerState.isRunning ? t("chessPause") : t("chessStart")}
                                </Text>
                            </Button>

                            <Button
                                className="h-12 rounded-xl"
                                variant="outline"
                                onPress={handleResetTimer}
                            >
                                <Text className="font-inter-semibold text-base text-foreground">
                                    {t("chessReset")}
                                </Text>
                            </Button>
                        </View>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}
