import { useCallback, useRef, useState } from "react"
import { DiceType } from "@/features/games/domain/dice"

const DICE_SPIN_DURATION_MS = 900

const rollDie = (sides: DiceType): number => Math.floor(Math.random() * sides) + 1

interface UseDiceRollResult {
    selectedDiceType: DiceType
    diceValue: number
    diceRollCount: number
    isRolling: boolean
    rollToken: number
    selectDiceType: (diceType: DiceType) => void
    rollDice: () => void
}

export const useDiceRoll = (): UseDiceRollResult => {
    const [selectedDiceType, setSelectedDiceType] = useState<DiceType>(6)
    const [diceValue, setDiceValue] = useState(1)
    const [diceRollCount, setDiceRollCount] = useState(0)
    const [isRolling, setIsRolling] = useState(false)
    const [rollToken, setRollToken] = useState(0)

    const currentRollTokenRef = useRef(0)
    const rollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const selectDiceType = useCallback((diceType: DiceType): void => {
        currentRollTokenRef.current += 1
        if (rollTimeoutRef.current !== null) {
            clearTimeout(rollTimeoutRef.current)
            rollTimeoutRef.current = null
        }
        setRollToken(previous => previous + 1)
        setIsRolling(false)
        setSelectedDiceType(diceType)
        setDiceValue(1)
    }, [])

    const rollDice = useCallback((): void => {
        const nextToken = currentRollTokenRef.current + 1
        const finalValue = rollDie(selectedDiceType)
        currentRollTokenRef.current = nextToken

        if (rollTimeoutRef.current !== null) {
            clearTimeout(rollTimeoutRef.current)
        }

        setIsRolling(true)
        setRollToken(nextToken)

        rollTimeoutRef.current = setTimeout(() => {
            if (currentRollTokenRef.current !== nextToken) return
            rollTimeoutRef.current = null
            setDiceValue(finalValue)
            setDiceRollCount(previous => previous + 1)
            setIsRolling(false)
        }, DICE_SPIN_DURATION_MS)
    }, [selectedDiceType])

    return {
        selectedDiceType,
        diceValue,
        diceRollCount,
        isRolling,
        rollToken,
        selectDiceType,
        rollDice,
    }
}
