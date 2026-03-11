import { MaterialIcons } from "@expo/vector-icons"
import { useFocusEffect, useNavigation, useRouter } from "expo-router"
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, View } from "react-native"
import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import {
    applyDraftChessTimeControl,
    CHESS_TIME_CONTROL_STORAGE_KEY,
    ChessTimeControl,
    ChessTimeControlState,
    formatChessTimeControl,
    getDefaultChessTimeControl,
    isChessTimeControlEqual,
    isChessTimerPristine,
    parseStoredChessTimeControl,
    updateDraftChessTimeControlState,
} from "@/features/games/domain/chessTimeControl"
import { useChessTimer } from "@/features/games/vm/useChessTimer"
import { COMMON_DICE_TYPES, useDiceRoll } from "@/features/games/vm/useDiceRoll"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

type GameMode = "d6" | "chess"

const DEFAULT_CHESS_TIME_CONTROL = getDefaultChessTimeControl()

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
            <Text className={cn("text-5xl font-bold", isActive ? "text-surface" : null)}>
                {formatClock(timeMs)}
            </Text>
        </View>
    )
}

export const GamesScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const router = useRouter()
    const { textSecondary } = useThemeRuntimeColors()

    const [mode, setMode] = useState<GameMode>("d6")
    const { selectedDiceType, diceValue, diceRollCount, isRolling, selectDiceType, rollDice } =
        useDiceRoll()
    const [timeControlState, setTimeControlState] = useState<ChessTimeControlState>({
        appliedTimeControl: DEFAULT_CHESS_TIME_CONTROL,
        draftTimeControl: DEFAULT_CHESS_TIME_CONTROL,
    })
    const [hasHydratedTimeControl, setHasHydratedTimeControl] = useState(false)

    const { timerState, toggleTimer, resetChessTimer, pressCurrentPlayer } = useChessTimer(
        timeControlState.appliedTimeControl,
    )
    const timerStateRef = useRef(timerState)

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("gamesTitle") })
    }, [navigation, t])

    useEffect(() => {
        timerStateRef.current = timerState
    }, [timerState])

    const syncStoredTimeControl = useCallback((storedTimeControl: ChessTimeControl): void => {
        setTimeControlState(currentState => {
            if (isChessTimeControlEqual(currentState.draftTimeControl, storedTimeControl)) {
                return currentState
            }

            return updateDraftChessTimeControlState(
                currentState,
                timerStateRef.current,
                storedTimeControl,
            )
        })
    }, [])

    useFocusEffect(
        useCallback(() => {
            let isMounted = true

            const hydrateTimeControl = async (): Promise<void> => {
                try {
                    const storedTimeControl = parseStoredChessTimeControl(
                        await getStoredJson<unknown>(CHESS_TIME_CONTROL_STORAGE_KEY),
                    )

                    if (storedTimeControl && isMounted) {
                        syncStoredTimeControl(storedTimeControl)
                    }
                } catch {
                    // Fall back to the current in-memory time control if local storage is unavailable.
                } finally {
                    if (isMounted) {
                        setHasHydratedTimeControl(true)
                    }
                }
            }

            void hydrateTimeControl()

            return () => {
                isMounted = false
            }
        }, [syncStoredTimeControl]),
    )

    useEffect(() => {
        if (!hasHydratedTimeControl) {
            return
        }

        void setStoredJson(CHESS_TIME_CONTROL_STORAGE_KEY, timeControlState.draftTimeControl)
    }, [hasHydratedTimeControl, timeControlState.draftTimeControl])

    const winnerLabel = timerState.winner
        ? t("chessWinner", { winner: t(getWinnerLabelKey(timerState.winner)) })
        : null

    const tabs = [
        { mode: "d6" as const, label: t("gamesDice") },
        { mode: "chess" as const, label: t("gamesChessTimer") },
    ]

    const timerIsPristine = isChessTimerPristine(timerState, timeControlState.appliedTimeControl)
    const hasPendingTimeControl = !isChessTimeControlEqual(
        timeControlState.appliedTimeControl,
        timeControlState.draftTimeControl,
    )

    const handleReset = useCallback((): void => {
        if (hasPendingTimeControl) {
            setTimeControlState(currentState => applyDraftChessTimeControl(currentState))
            return
        }

        resetChessTimer()
    }, [hasPendingTimeControl, resetChessTimer])

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
                            <Text className="text-center text-7xl font-bold">{diceValue}</Text>
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
                        <View className="gap-3">
                            <View className="flex-row items-start justify-between gap-3">
                                <Pressable
                                    accessibilityLabel={`${t("chessTimeControlPickerTitle")}: ${formatChessTimeControl(timeControlState.draftTimeControl)}`}
                                    accessibilityRole="button"
                                    className="self-start rounded-full bg-surface-muted px-4 py-2"
                                    onPress={() => {
                                        router.push("/chess-time-control")
                                    }}
                                >
                                    <View className="flex-row items-center gap-1.5">
                                        <Text
                                            className="text-2xl font-bold"
                                            style={{ fontVariant: ["tabular-nums"] }}
                                        >
                                            {formatChessTimeControl(
                                                timeControlState.draftTimeControl,
                                            )}
                                        </Text>
                                        <MaterialIcons
                                            color={textSecondary}
                                            name="expand-less"
                                            size={22}
                                        />
                                    </View>
                                </Pressable>

                                <Text className="pt-2 text-base font-semibold text-text-secondary">
                                    {t("chessMoves", { count: timerState.moveCount })}
                                </Text>
                            </View>

                            {hasPendingTimeControl && !timerIsPristine ? (
                                <Text className="text-sm font-semibold text-text-secondary">
                                    {t("chessPendingTimeControl")}
                                </Text>
                            ) : null}
                        </View>

                        <Pressable className="gap-3" onPress={pressCurrentPlayer}>
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

                            <Button variant="secondary" onPress={handleReset}>
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
