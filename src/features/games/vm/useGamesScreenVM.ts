import { useCallback, useEffect, useRef, useState } from "react"
import { AppState } from "react-native"
import {
    ChessPlayer,
    ChessTimerState,
    completeMove,
    pause,
    resetTimer,
    selectActivePlayer,
    tick,
    toggleStartPause,
} from "@/features/games/domain/chessTimer"

type GameMode = "d6" | "chess"
export type DiceType = 4 | 6 | 8 | 10 | 12 | 20

export const COMMON_DICE_TYPES: readonly DiceType[] = [4, 6, 8, 10, 12, 20]

const INITIAL_CHESS_MS = 15 * 60 * 1000
const INCREMENT_MS = 2 * 1000
const TIMER_POLL_INTERVAL_MS = 200

const rollDie = (sides: DiceType): number => Math.floor(Math.random() * sides) + 1

export const useGamesScreenVM = () => {
    const [mode, setMode] = useState<GameMode>("d6")
    const [selectedDiceType, setSelectedDiceType] = useState<DiceType>(6)
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

    return {
        state: {
            mode,
            selectedDiceType,
            diceValue,
            diceRollCount,
            timerState,
        },
        actions: {
            setMode,
            setSelectedDiceType: (nextDiceType: DiceType): void => {
                setSelectedDiceType(nextDiceType)
                setDiceValue(previous => Math.min(previous, nextDiceType))
            },
            rollDice: (): void => {
                setDiceValue(rollDie(selectedDiceType))
                setDiceRollCount(previous => previous + 1)
            },
            toggleTimer: handleToggleTimer,
            resetTimer: (): void => {
                setTimerState(resetTimer(INITIAL_CHESS_MS, INCREMENT_MS))
                lastTickAtRef.current = null
            },
            pressPlayer: handlePressPlayer,
            pressCurrentPlayer: (): void => {
                handlePressPlayer(timerState.activePlayer)
            },
        },
    }
}
