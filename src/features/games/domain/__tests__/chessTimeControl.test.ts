import {
    applyDraftChessTimeControl,
    BLITZ_CHESS_TIME_CONTROL,
    CHESS_TIME_CONTROL_OPTIONS,
    CLASSIC_CHESS_TIME_CONTROL,
    createCustomChessTimeControl,
    findMatchingChessTimeControlOption,
    formatChessTimeControl,
    getDefaultChessTimeControl,
    isChessTimeControlEqual,
    parseStoredChessTimeControl,
    RAPID_CHESS_TIME_CONTROL,
    sanitizeChessNumericInput,
    updateDraftChessTimeControlState,
} from "../chessTimeControl"
import { resetTimer } from "../chessTimer"

describe("chessTimeControl", () => {
    test("preset helpers return the expected time controls", () => {
        expect(getDefaultChessTimeControl()).toEqual(RAPID_CHESS_TIME_CONTROL)
        expect(CLASSIC_CHESS_TIME_CONTROL).toEqual({
            preset: "classic",
            initialMs: 30 * 60 * 1000,
            incrementMs: 0,
        })
        expect(BLITZ_CHESS_TIME_CONTROL).toEqual({
            preset: "blitz",
            initialMs: 3 * 60 * 1000,
            incrementMs: 2 * 1000,
        })
    })

    test("createCustomChessTimeControl clamps values to whole-number bounds", () => {
        expect(createCustomChessTimeControl(240.9, -4)).toEqual({
            preset: "custom",
            initialMs: 180 * 60 * 1000,
            incrementMs: 0,
        })
    })

    test("preset options include the routed sheet presets in display order", () => {
        expect(
            CHESS_TIME_CONTROL_OPTIONS.map(option => formatChessTimeControl(option.timeControl)),
        ).toEqual([
            "1+0",
            "2+1",
            "3+0",
            "3+2",
            "5+0",
            "5+3",
            "10+0",
            "10+5",
            "15+10",
            "30+0",
            "30+20",
        ])
    })

    test("sanitizeChessNumericInput keeps digits only", () => {
        expect(sanitizeChessNumericInput("1a5+2")).toBe("152")
    })

    test("parseStoredChessTimeControl returns null for invalid payloads", () => {
        expect(parseStoredChessTimeControl({ preset: "rapid", initialMs: "900000" })).toBeNull()
        expect(
            parseStoredChessTimeControl({
                preset: "correspondence",
                initialMs: 60000,
                incrementMs: 0,
            }),
        ).toBeNull()
    })

    test("matching a custom time control ignores the preset category when values are equal", () => {
        const customThirtyZero = createCustomChessTimeControl(30, 0)

        expect(isChessTimeControlEqual(customThirtyZero, CLASSIC_CHESS_TIME_CONTROL)).toBe(true)
        expect(findMatchingChessTimeControlOption(customThirtyZero)?.key).toBe("classic-30-0")
    })

    test("changing draft while pristine updates both draft and applied controls", () => {
        const state = {
            appliedTimeControl: RAPID_CHESS_TIME_CONTROL,
            draftTimeControl: RAPID_CHESS_TIME_CONTROL,
        }

        const next = updateDraftChessTimeControlState(
            state,
            resetTimer(RAPID_CHESS_TIME_CONTROL.initialMs, RAPID_CHESS_TIME_CONTROL.incrementMs),
            CLASSIC_CHESS_TIME_CONTROL,
        )

        expect(next.appliedTimeControl).toEqual(CLASSIC_CHESS_TIME_CONTROL)
        expect(next.draftTimeControl).toEqual(CLASSIC_CHESS_TIME_CONTROL)
    })

    test("changing draft after play starts keeps the applied control until reset", () => {
        const state = {
            appliedTimeControl: RAPID_CHESS_TIME_CONTROL,
            draftTimeControl: RAPID_CHESS_TIME_CONTROL,
        }
        const timerState = {
            ...resetTimer(RAPID_CHESS_TIME_CONTROL.initialMs, RAPID_CHESS_TIME_CONTROL.incrementMs),
            whiteMs: RAPID_CHESS_TIME_CONTROL.initialMs - 5000,
            isRunning: true,
        }

        const next = updateDraftChessTimeControlState(state, timerState, BLITZ_CHESS_TIME_CONTROL)

        expect(next.appliedTimeControl).toEqual(RAPID_CHESS_TIME_CONTROL)
        expect(next.draftTimeControl).toEqual(BLITZ_CHESS_TIME_CONTROL)
    })

    test("applyDraftChessTimeControl promotes the pending control on reset", () => {
        const next = applyDraftChessTimeControl({
            appliedTimeControl: RAPID_CHESS_TIME_CONTROL,
            draftTimeControl: BLITZ_CHESS_TIME_CONTROL,
        })

        expect(next.appliedTimeControl).toEqual(BLITZ_CHESS_TIME_CONTROL)
        expect(next.draftTimeControl).toEqual(BLITZ_CHESS_TIME_CONTROL)
    })
})
