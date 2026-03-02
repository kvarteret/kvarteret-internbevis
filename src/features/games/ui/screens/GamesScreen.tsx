import { useNavigation } from "expo-router"
import React, { useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, View } from "react-native"
import { useChessTimer } from "@/features/games/vm/useChessTimer"
import { COMMON_DICE_TYPES, useDiceRoll } from "@/features/games/vm/useDiceRoll"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

type GameMode = "d6" | "chess"

const INITIAL_CHESS_MS = 15 * 60 * 1000
const INCREMENT_MS = 2 * 1000

const formatClock = (milliseconds: number): string => {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${String(seconds).padStart(2, "0")}`
}

const getWinnerLabelKey = (winner: "white" | "black"): "chessWhite" | "chessBlack" =>
    winner === "white" ? "chessWhite" : "chessBlack"

interface ClockCardProps {
    player: "white" | "black"
    label: string
    timeMs: number
    activePlayer: "white" | "black"
    isRunning: boolean
    hasWinner: boolean
}

const ClockCard = ({
    player,
    label,
    timeMs,
    activePlayer,
    isRunning,
    hasWinner,
}: ClockCardProps): React.JSX.Element => {
    const isActive = activePlayer === player

    const cardClass = (() => {
        if (!isActive || hasWinner) return "rounded-xl border border-border bg-surface-muted p-3.5"
        if (isRunning) return "rounded-xl border border-state-danger bg-state-danger p-3.5"
        return "rounded-xl border border-state-danger bg-state-danger/45 p-3.5"
    })()

    return (
                <View className={cardClass}>
            <Text
                className={cn(
                    "mb-1.5 text-sm font-semibold",
                    isActive ? "text-surface" : "text-text-secondary",
                )}
            >
                {label}
            </Text>
            <Text
                className={cn(
                    "text-5xl font-bold",
                    isActive ? "text-surface" : null,
                )}
            >
                {formatClock(timeMs)}
            </Text>
        </View>
    )
}

export const GamesScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()

    const [mode, setMode] = useState<GameMode>("d6")
    const { selectedDiceType, diceValue, diceRollCount, isRolling, selectDiceType, rollDice } =
        useDiceRoll()

    const { timerState, toggleTimer, resetChessTimer, pressCurrentPlayer } = useChessTimer(
        INITIAL_CHESS_MS,
        INCREMENT_MS,
    )

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("gamesTitle") })
    }, [navigation, t])

    const winnerLabel = timerState.winner
        ? t("chessWinner", { winner: t(getWinnerLabelKey(timerState.winner)) })
        : null

    const tabs = [
        { mode: "d6" as const, label: t("gamesDice") },
        { mode: "chess" as const, label: t("gamesChessTimer") },
    ]

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerClassName="flex-grow gap-4 p-4"
                contentInsetAdjustmentBehavior="automatic"
            >
                <View className="rounded-xl border border-editorial-border bg-text-primary/5 p-1">
                    <View className="flex-row rounded-lg">
                        {tabs.map(tab => {
                            const isSelected = tab.mode === mode
                            return (
                                <Pressable
                                    key={tab.mode}
                                    className={cn(
                                        "flex-1 rounded-lg px-3 py-2",
                                        isSelected ? "bg-editorial-surface" : "bg-transparent",
                                    )}
                                    onPress={() => setMode(tab.mode)}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: isSelected }}
                                >
                                    <Text
                                        className={cn(
                                            "text-center text-sm font-semibold",
                                            isSelected ? null : "text-text-secondary",
                                        )}
                                    >
                                        {tab.label}
                                    </Text>
                                </Pressable>
                            )
                        })}
                    </View>
                </View>

                {mode === "d6" ? (
                    <Card className="gap-4 p-4" effect="liquid" variant="grouped">
                        <Text className="text-2xl font-bold">
                            {t("gamesDice")}
                        </Text>
                        <View className="gap-2">
                            <Text className="text-sm text-text-secondary font-semibold">
                                {t("gamesSelectDie")}
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {COMMON_DICE_TYPES.map(diceType => {
                                    const selected = diceType === selectedDiceType
                                    return (
                                        <Pressable
                                            key={diceType}
                                            className={cn(
                                                "rounded-full px-3 py-2",
                                                selected ? "bg-text-primary" : "bg-surface/80",
                                                isRolling && "opacity-70",
                                            )}
                                            disabled={isRolling}
                                            onPress={() => {
                                                selectDiceType(diceType)
                                            }}
                                        >
                                            <Text
                                                className={cn(
                                                    "text-sm font-semibold",
                                                    selected ? "text-surface" : null,
                                                )}
                                            >
                                                {`d${diceType}`}
                                            </Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                        <Card
                            className="items-center gap-1 py-6"
                            effect="liquid"
                            variant="elevated"
                        >
                            <Text className="text-center text-7xl font-bold">
                                {diceValue}
                            </Text>
                            <Text className="text-center text-sm text-text-secondary">
                                {t("gamesDiceRolls", { count: diceRollCount })}
                            </Text>
                        </Card>

                        <Button onPress={rollDice}>
                            <Text className="text-base leading-5 font-semibold text-surface">
                                {t("gamesRollDie", { die: `d${selectedDiceType}` })}
                            </Text>
                        </Button>
                    </Card>
                ) : (
                    <Card className="gap-4 p-4" effect="liquid" variant="grouped">
                        <Text className="text-2xl font-bold">
                            {t("gamesChessTimer")}
                        </Text>

                        <Pressable className="gap-3" onPress={pressCurrentPlayer}>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-base text-text-secondary font-semibold">
                                    {t("chessTimeControl")}
                                </Text>
                                <Text className="text-base text-text-secondary font-semibold">
                                    {t("chessMoves", { count: timerState.moveCount })}
                                </Text>
                            </View>

                            <ClockCard
                                player="white"
                                label={t("chessWhite")}
                                timeMs={timerState.whiteMs}
                                activePlayer={timerState.activePlayer}
                                isRunning={timerState.isRunning}
                                hasWinner={Boolean(timerState.winner)}
                            />

                            <ClockCard
                                player="black"
                                label={t("chessBlack")}
                                timeMs={timerState.blackMs}
                                activePlayer={timerState.activePlayer}
                                isRunning={timerState.isRunning}
                                hasWinner={Boolean(timerState.winner)}
                            />

                            {winnerLabel ? (
                                <Text className="text-base text-state-success font-bold">
                                    {winnerLabel}
                                </Text>
                            ) : null}
                        </Pressable>

                        <View className="mt-1 gap-2.5">
                            <Button onPress={toggleTimer}>
                                <Text className="text-base leading-5 font-semibold text-surface">
                                    {timerState.isRunning ? t("chessPause") : t("chessStart")}
                                </Text>
                            </Button>

                            <Button variant="secondary" onPress={resetChessTimer}>
                                {t("chessReset")}
                            </Button>
                        </View>
                    </Card>
                )}

                <EtjenestenFooter />
            </ScrollView>
        </View>
    )
}
