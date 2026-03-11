import { useCallback, useRef, useState } from "react"
import {
    cancelAnimation,
    Easing,
    runOnJS,
    useAnimatedReaction,
    useSharedValue,
    withTiming,
} from "react-native-reanimated"
import { DiceType } from "@/features/games/domain/dice"

const DICE_SPIN_DURATION_MS = 900
const DICE_SPIN_FRAMES = 18

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

    const selectDiceType = useCallback(
        (diceType: DiceType): void => {
            currentRollTokenRef.current += 1
            currentRollSidesRef.current = diceType
            currentFinalValueRef.current = 1
            setRollToken(previous => previous + 1)
            setIsRolling(false)
            cancelAnimation(spinProgress)
            spinToken.value = 0
            frameIndex.value = 0
            setSelectedDiceType(diceType)
            setDiceValue(1)
        },
        [frameIndex, spinProgress, spinToken],
    )

    const rollDice = useCallback((): void => {
        const nextToken = currentRollTokenRef.current + 1
        const finalValue = rollDie(selectedDiceType)
        currentRollTokenRef.current = nextToken
        currentRollSidesRef.current = selectedDiceType
        currentFinalValueRef.current = finalValue

        setIsRolling(true)
        setRollToken(nextToken)
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
        rollToken,
        selectDiceType,
        rollDice,
    }
}
