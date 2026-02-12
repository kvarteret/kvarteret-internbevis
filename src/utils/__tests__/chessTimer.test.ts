import {
  ChessTimerState,
  completeMove,
  pause,
  resetTimer,
  selectActivePlayer,
  tick,
  toggleStartPause,
} from "../chessTimer";

function runningState(overrides: Partial<ChessTimerState> = {}): ChessTimerState {
  return {
    ...resetTimer(15 * 60 * 1000, 2000),
    isRunning: true,
    ...overrides,
  };
}

describe("chessTimer", () => {
  test("tick decrements active player using elapsed milliseconds", () => {
    const state = runningState({ activePlayer: "white" });
    const next = tick(state, 1500);

    expect(next.whiteMs).toBe(898500);
    expect(next.blackMs).toBe(900000);
    expect(next.winner).toBeNull();
    expect(next.isRunning).toBe(true);
  });

  test("tick clamps at zero and sets winner exactly on timeout", () => {
    const state = runningState({ activePlayer: "black", blackMs: 1000 });
    const next = tick(state, 1500);

    expect(next.blackMs).toBe(0);
    expect(next.whiteMs).toBe(900000);
    expect(next.winner).toBe("white");
    expect(next.isRunning).toBe(false);
  });

  test("completeMove applies increment, increments moveCount, and switches player", () => {
    const state = runningState({ activePlayer: "white", whiteMs: 500000, moveCount: 3 });
    const next = completeMove(state);

    expect(next.whiteMs).toBe(502000);
    expect(next.blackMs).toBe(900000);
    expect(next.activePlayer).toBe("black");
    expect(next.moveCount).toBe(4);
    expect(next.isRunning).toBe(true);
  });

  test("completeMove has no effect when paused or finished", () => {
    const paused = { ...resetTimer(900000, 2000), activePlayer: "white" as const };
    const finished = { ...runningState(), winner: "white" as const, isRunning: false };

    expect(completeMove(paused)).toEqual(paused);
    expect(completeMove(finished)).toEqual(finished);
  });

  test("resetTimer returns paused baseline state with increment and move count", () => {
    const next = resetTimer(15 * 60 * 1000, 2000);

    expect(next).toEqual({
      whiteMs: 900000,
      blackMs: 900000,
      activePlayer: "white",
      isRunning: false,
      winner: null,
      moveCount: 0,
      incrementMs: 2000,
    });
  });

  test("selectActivePlayer only works while paused and without winner", () => {
    const paused = resetTimer(900000, 2000);
    const running = { ...paused, isRunning: true };

    expect(selectActivePlayer(paused, "black").activePlayer).toBe("black");
    expect(selectActivePlayer(running, "black").activePlayer).toBe("white");
    expect(selectActivePlayer({ ...paused, winner: "black" }, "black").activePlayer).toBe("white");
  });

  test("toggleStartPause and pause respect winner state", () => {
    const paused = resetTimer(900000, 2000);
    const running = { ...paused, isRunning: true };
    const finished = { ...running, winner: "black" as const, isRunning: false };

    expect(toggleStartPause(paused).isRunning).toBe(true);
    expect(toggleStartPause(running).isRunning).toBe(false);
    expect(toggleStartPause(finished).isRunning).toBe(false);
    expect(pause(running).isRunning).toBe(false);
    expect(pause(finished).isRunning).toBe(false);
  });
});
