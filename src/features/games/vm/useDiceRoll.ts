import { useCallback, useRef, useState } from "react"
import {
    Easing,
    cancelAnimation,
    runOnJS,
    useAnimatedReaction,
    useSharedValue,
    withTiming,
} from "react-native-reanimated"

export type DiceType = 4 | 6 | 8 | 10 | 12 | 20

export const COMMON_DICE_TYPES: readonly DiceType[] = [4, 6, 8, 10, 12, 20]

const DICE_SPIN_DURATION_MS = 250
const DICE_SPIN_FRAMES = 8

const rollDie = (sides: DiceType): number => Math.floor(Math.random() * sides) + 1

interface UseDiceRollResult {
    selectedDiceType: DiceType
    diceValue: number
    diceRollCount: number
    isRolling: boolean
    selectDiceType: (diceType: DiceType) => void
    rollDice: () => void
}

export const useDiceRoll = (): UseDiceRollResult => {
    const [selectedDiceType, setSelectedDiceType] = useState<DiceType>(6)
    const [diceValue, setDiceValue] = useState(1)
    const [diceRollCount, setDiceRollCount] = useState(0)
    const [isRolling, setIsRolling] = useState(false)

    const currentRollTokenRef = useRef(0)
    const currentRollSidesRef = useRef<DiceType>(6)
    const currentFinalValueRef = useRef(1)

    const spinProgress = useSharedValue(0)
    const spinToken = useSharedValue(0)
    const frameIndex = useSharedValue(0)

    const updateRandomDuringSpin = useCallback((token: number): void => {
        if (token !== currentRollTokenRef.current) return
        setDiceValue(rollDie(currentRollSidesRef.current))
    }, [])

    const finalizeRoll = useCallback((token: number): void => {
        if (token !== currentRollTokenRef.current) return

        setDiceValue(currentFinalValueRef.current)
        setDiceRollCount(previous => previous + 1)
        setIsRolling(false)
    }, [])

    useAnimatedReaction(
        () => ({
            progress: spinProgress.value,
            token: spinToken.value,
        }),
        ({ progress, token }) => {
            if (token === 0) return

            const nextFrame = Math.floor(progress * DICE_SPIN_FRAMES)
            if (nextFrame > frameIndex.value && progress < 1) {
                frameIndex.value = nextFrame
                runOnJS(updateRandomDuringSpin)(token)
            }
        },
    )

    const selectDiceType = useCallback((diceType: DiceType): void => {
        setSelectedDiceType(diceType)
        setDiceValue(previous => Math.min(previous, diceType))
    }, [])

    const rollDice = useCallback((): void => {
        const nextToken = currentRollTokenRef.current + 1
        const finalValue = rollDie(selectedDiceType)
        currentRollTokenRef.current = nextToken
        currentRollSidesRef.current = selectedDiceType
        currentFinalValueRef.current = finalValue

        setIsRolling(true)
        setDiceValue(rollDie(selectedDiceType))

        cancelAnimation(spinProgress)
        frameIndex.value = 0
        spinToken.value = nextToken
        spinProgress.value = 0
        spinProgress.value = withTiming(
            1,
            {
                duration: DICE_SPIN_DURATION_MS,
                easing: Easing.out(Easing.cubic),
            },
            finished => {
                if (finished) {
                    runOnJS(finalizeRoll)(nextToken)
                }
            },
        )
    }, [selectedDiceType, spinProgress, frameIndex, spinToken, finalizeRoll])

    return {
        selectedDiceType,
        diceValue,
        diceRollCount,
        isRolling,
        selectDiceType,
        rollDice,
    }
}
