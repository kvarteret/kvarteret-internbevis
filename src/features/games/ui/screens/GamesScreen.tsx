import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { useLayoutEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { RootStackParamList } from "@/app/navigation/types"
import { useChessTimer } from "@/features/games/vm/useChessTimer"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

type GameMode = "d6" | "chess"
type DiceType = 4 | 6 | 8 | 10 | 12 | 20

const COMMON_DICE_TYPES: readonly DiceType[] = [4, 6, 8, 10, 12, 20]
const INITIAL_CHESS_MS = 15 * 60 * 1000
const INCREMENT_MS = 2 * 1000

const rollDie = (sides: DiceType): number => Math.floor(Math.random() * sides) + 1

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
        return "rounded-xl border border-state-danger bg-[#AA000073] p-3.5"
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
                    isActive ? "text-surface" : "text-text-primary",
                )}
            >
                {formatClock(timeMs)}
            </Text>
        </View>
    )
}

export const GamesScreen = ({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "Games">): React.JSX.Element => {
    const { t } = useTranslation()

    const [mode, setMode] = useState<GameMode>("d6")
    const [selectedDiceType, setSelectedDiceType] = useState<DiceType>(6)
    const [diceValue, setDiceValue] = useState(1)
    const [diceRollCount, setDiceRollCount] = useState(0)

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
        <SafeAreaView className="flex-1" edges={["left", "right", "bottom"]}>
            <ScrollView className="flex-1" contentContainerClassName="flex-grow gap-4 p-4">
                <View className="flex-row gap-2.5">
                    {tabs.map(({ mode: tabMode, label }) => (
                        <Pressable
                            key={tabMode}
                            className={cn(
                                "flex-1 items-center justify-center rounded-xl border px-3 py-3",
                                mode === tabMode
                                    ? "border-text-primary bg-text-primary"
                                    : "border-border bg-surface",
                            )}
                            onPress={() => setMode(tabMode)}
                        >
                            <Text
                                className={cn(
                                    "text-[15px] font-semibold",
                                    mode === tabMode ? "text-surface" : "text-text-primary",
                                )}
                            >
                                {label}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {mode === "d6" ? (
                    <Card className="gap-3 p-4">
                        <Text className="text-2xl font-bold">{t("gamesDice")}</Text>
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
                                                "rounded-lg border px-3 py-2",
                                                selected
                                                    ? "border-text-primary bg-text-primary"
                                                    : "border-border bg-surface",
                                            )}
                                            onPress={() => {
                                            setSelectedDiceType(diceType)
                                            setDiceValue(previous => Math.min(previous, diceType))
                                        }}
                                        >
                                            <Text
                                                className={cn(
                                                    "text-sm font-semibold",
                                                    selected ? "text-surface" : "text-text-primary",
                                                )}
                                            >
                                                {`d${diceType}`}
                                            </Text>
                                        </Pressable>
                                    )
                                })}
                            </View>
                        </View>
                        <Text className="text-center text-7xl font-bold">{diceValue}</Text>
                        <Text className="text-center text-sm text-text-secondary">
                            {t("gamesDiceRolls", { count: diceRollCount })}
                        </Text>

                        <Pressable
                            className="items-center rounded-xl border border-text-primary bg-text-primary py-3"
                            onPress={() => {
                                setDiceValue(rollDie(selectedDiceType))
                                setDiceRollCount(previous => previous + 1)
                            }}
                        >
                            <Text className="text-base text-surface font-bold">
                                {t("gamesRollDie", { die: `d${selectedDiceType}` })}
                            </Text>
                        </Pressable>
                    </Card>
                ) : (
                    <Card className="gap-3 p-4">
                        <Text className="text-2xl font-bold">{t("gamesChessTimer")}</Text>

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
                                <Text className="text-base text-[#0F766E] font-bold">
                                    {winnerLabel}
                                </Text>
                            ) : null}
                        </Pressable>

                        <View className="mt-1 gap-2.5">
                            <Pressable
                                className="items-center rounded-xl border border-text-primary bg-text-primary py-3"
                                onPress={toggleTimer}
                            >
                                <Text className="text-base text-surface font-bold">
                                    {timerState.isRunning ? t("chessPause") : t("chessStart")}
                                </Text>
                            </Pressable>

                            <Pressable
                                className="items-center rounded-xl border border-border bg-surface py-3"
                                onPress={resetChessTimer}
                            >
                                <Text className="text-base text-text-primary font-semibold">
                                    {t("chessReset")}
                                </Text>
                            </Pressable>
                        </View>
                    </Card>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}
