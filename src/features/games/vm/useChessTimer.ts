import { useCallback, useEffect, useRef, useState } from "react"
import { AppState } from "react-native"
import { ChessTimeControl } from "@/features/games/domain/chessTimeControl"
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

const TIMER_POLL_INTERVAL_MS = 200

interface UseChessTimerResult {
    timerState: ChessTimerState
    toggleTimer: () => void
    resetChessTimer: () => void
    pressCurrentPlayer: () => void
}

export const useChessTimer = (timeControl: ChessTimeControl): UseChessTimerResult => {
    const [timerState, setTimerState] = useState<ChessTimerState>(() =>
        resetTimer(timeControl.initialMs, timeControl.incrementMs),
    )

    const timerStateRef = useRef(timerState)
    const lastTickAtRef = useRef<number | null>(null)

    useEffect(() => {
        timerStateRef.current = timerState
    }, [timerState])

    useEffect(() => {
        setTimerState(resetTimer(timeControl.initialMs, timeControl.incrementMs))
        lastTickAtRef.current = null
    }, [timeControl.preset, timeControl.initialMs, timeControl.incrementMs])

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

    const handlePressPlayer = useCallback((player: ChessPlayer): void => {
        setTimerState(previous => {
            if (previous.winner) return previous

            if (!previous.isRunning) {
                return selectActivePlayer(previous, player)
            }

            if (player !== previous.activePlayer) return previous

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
    }, [])

    const toggleTimer = useCallback((): void => {
        if (timerState.winner) {
            setTimerState(resetTimer(timeControl.initialMs, timeControl.incrementMs))
            lastTickAtRef.current = null
            return
        }

        if (timerState.isRunning) {
            pauseWithElapsed()
            return
        }

        lastTickAtRef.current = Date.now()
        setTimerState(previous => toggleStartPause(previous))
    }, [
        timerState.winner,
        timerState.isRunning,
        pauseWithElapsed,
        timeControl.initialMs,
        timeControl.incrementMs,
    ])

    const resetChessTimer = useCallback((): void => {
        setTimerState(resetTimer(timeControl.initialMs, timeControl.incrementMs))
        lastTickAtRef.current = null
    }, [timeControl.initialMs, timeControl.incrementMs])

    const pressCurrentPlayer = useCallback((): void => {
        handlePressPlayer(timerStateRef.current.activePlayer)
    }, [handlePressPlayer])

    return { timerState, toggleTimer, resetChessTimer, pressCurrentPlayer }
}
