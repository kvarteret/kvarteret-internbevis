import { z } from "zod"
import { ChessTimerState } from "@/features/games/domain/chessTimer"

export type ChessTimeControlPreset = "bullet" | "rapid" | "classic" | "blitz" | "custom"

export interface ChessTimeControl {
    preset: ChessTimeControlPreset
    initialMs: number
    incrementMs: number
}

export interface ChessTimeControlOption {
    key: string
    timeControl: ChessTimeControl
}

export interface ChessTimeControlState {
    appliedTimeControl: ChessTimeControl
    draftTimeControl: ChessTimeControl
}

export const CHESS_TIME_CONTROL_STORAGE_KEY = "games_chess_time_control"
export const CHESS_MINUTES_PER_SIDE_MIN = 1
export const CHESS_MINUTES_PER_SIDE_MAX = 180
export const CHESS_INCREMENT_SECONDS_MIN = 0
export const CHESS_INCREMENT_SECONDS_MAX = 60

const MINUTE_MS = 60 * 1000
const SECOND_MS = 1000

const chessTimeControlStorageSchema = z
    .object({
        preset: z.enum(["bullet", "rapid", "classic", "blitz", "custom"]),
        initialMs: z.number().int(),
        incrementMs: z.number().int(),
    })
    .strict()

const clampInteger = (value: number, minimum: number, maximum: number): number => {
    if (!Number.isFinite(value)) {
        return minimum
    }

    return Math.min(maximum, Math.max(minimum, Math.floor(value)))
}

export const sanitizeChessNumericInput = (value: string): string => value.replace(/\D+/g, "")

export const clampChessMinutesPerSide = (value: number): number =>
    clampInteger(value, CHESS_MINUTES_PER_SIDE_MIN, CHESS_MINUTES_PER_SIDE_MAX)

export const clampChessIncrementSeconds = (value: number): number =>
    clampInteger(value, CHESS_INCREMENT_SECONDS_MIN, CHESS_INCREMENT_SECONDS_MAX)

const createChessTimeControl = (
    preset: ChessTimeControlPreset,
    minutesPerSide: number,
    incrementSeconds: number,
): ChessTimeControl => ({
    preset,
    initialMs: clampChessMinutesPerSide(minutesPerSide) * MINUTE_MS,
    incrementMs: clampChessIncrementSeconds(incrementSeconds) * SECOND_MS,
})

const createPresetChessTimeControl = (
    preset: Exclude<ChessTimeControlPreset, "custom">,
    minutesPerSide: number,
    incrementSeconds: number,
): ChessTimeControl => createChessTimeControl(preset, minutesPerSide, incrementSeconds)

export const RAPID_CHESS_TIME_CONTROL = createPresetChessTimeControl("rapid", 15, 2)
export const CLASSIC_CHESS_TIME_CONTROL = createPresetChessTimeControl("classic", 30, 0)
export const BLITZ_CHESS_TIME_CONTROL = createPresetChessTimeControl("blitz", 3, 2)

export const CHESS_TIME_CONTROL_OPTIONS: ChessTimeControlOption[] = [
    {
        key: "bullet-1-0",
        timeControl: createPresetChessTimeControl("bullet", 1, 0),
    },
    {
        key: "bullet-2-1",
        timeControl: createPresetChessTimeControl("bullet", 2, 1),
    },
    {
        key: "blitz-3-0",
        timeControl: createPresetChessTimeControl("blitz", 3, 0),
    },
    {
        key: "blitz-3-2",
        timeControl: createPresetChessTimeControl("blitz", 3, 2),
    },
    {
        key: "blitz-5-0",
        timeControl: createPresetChessTimeControl("blitz", 5, 0),
    },
    {
        key: "blitz-5-3",
        timeControl: createPresetChessTimeControl("blitz", 5, 3),
    },
    {
        key: "rapid-10-0",
        timeControl: createPresetChessTimeControl("rapid", 10, 0),
    },
    {
        key: "rapid-10-5",
        timeControl: createPresetChessTimeControl("rapid", 10, 5),
    },
    {
        key: "rapid-15-10",
        timeControl: createPresetChessTimeControl("rapid", 15, 10),
    },
    {
        key: "classic-30-0",
        timeControl: createPresetChessTimeControl("classic", 30, 0),
    },
    {
        key: "classic-30-20",
        timeControl: createPresetChessTimeControl("classic", 30, 20),
    },
]

export const getChessTimeControlMinutesPerSide = (timeControl: ChessTimeControl): number =>
    clampChessMinutesPerSide(Math.round(timeControl.initialMs / MINUTE_MS))

export const getChessTimeControlIncrementSeconds = (timeControl: ChessTimeControl): number =>
    clampChessIncrementSeconds(Math.round(timeControl.incrementMs / SECOND_MS))

export const formatChessTimeControl = (timeControl: ChessTimeControl): string =>
    `${getChessTimeControlMinutesPerSide(timeControl)}+${getChessTimeControlIncrementSeconds(timeControl)}`

export const getDefaultChessTimeControl = (): ChessTimeControl => RAPID_CHESS_TIME_CONTROL

export const createCustomChessTimeControl = (
    minutesPerSide: number,
    incrementSeconds: number,
): ChessTimeControl => createChessTimeControl("custom", minutesPerSide, incrementSeconds)

export const isChessTimeControlEqual = (left: ChessTimeControl, right: ChessTimeControl): boolean =>
    left.initialMs === right.initialMs && left.incrementMs === right.incrementMs

export const findMatchingChessTimeControlOption = (
    timeControl: ChessTimeControl,
): ChessTimeControlOption | null =>
    CHESS_TIME_CONTROL_OPTIONS.find(option =>
        isChessTimeControlEqual(option.timeControl, timeControl),
    ) ?? null

export const isChessTimerPristine = (
    timerState: ChessTimerState,
    appliedTimeControl: ChessTimeControl,
): boolean =>
    !timerState.isRunning &&
    !timerState.winner &&
    timerState.moveCount === 0 &&
    timerState.whiteMs === appliedTimeControl.initialMs &&
    timerState.blackMs === appliedTimeControl.initialMs &&
    timerState.incrementMs === appliedTimeControl.incrementMs

export const updateDraftChessTimeControlState = (
    state: ChessTimeControlState,
    timerState: ChessTimerState,
    nextDraftTimeControl: ChessTimeControl,
): ChessTimeControlState => {
    if (isChessTimerPristine(timerState, state.appliedTimeControl)) {
        return {
            appliedTimeControl: nextDraftTimeControl,
            draftTimeControl: nextDraftTimeControl,
        }
    }

    return {
        appliedTimeControl: state.appliedTimeControl,
        draftTimeControl: nextDraftTimeControl,
    }
}

export const applyDraftChessTimeControl = (
    state: ChessTimeControlState,
): ChessTimeControlState => ({
    appliedTimeControl: state.draftTimeControl,
    draftTimeControl: state.draftTimeControl,
})

export const parseStoredChessTimeControl = (value: unknown): ChessTimeControl | null => {
    const parsed = chessTimeControlStorageSchema.safeParse(value)
    if (!parsed.success) {
        return null
    }

    const normalizedMinutes = clampChessMinutesPerSide(parsed.data.initialMs / MINUTE_MS)
    const normalizedIncrement = clampChessIncrementSeconds(parsed.data.incrementMs / SECOND_MS)

    return createChessTimeControl(parsed.data.preset, normalizedMinutes, normalizedIncrement)
}
