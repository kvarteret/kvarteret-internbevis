import {
  ChessTimerState,
  resetTimer,
  selectActivePlayer,
  switchTurn,
  tick,
  toggleStartPause,
} from '../chessTimer';

function runningState(overrides: Partial<ChessTimerState> = {}): ChessTimerState {
  return {
    ...resetTimer(300000),
    isRunning: true,
    ...overrides,
  };
}

describe('chessTimer', () => {
  test('tick decrements active player using elapsed milliseconds', () => {
    const state = runningState({ activePlayer: 'white' });
    const next = tick(state, 1500);

    expect(next.whiteMs).toBe(298500);
    expect(next.blackMs).toBe(300000);
    expect(next.winner).toBeNull();
    expect(next.isRunning).toBe(true);
  });

  test('tick clamps at zero and sets winner exactly on timeout', () => {
    const state = runningState({ activePlayer: 'black', blackMs: 1000 });
    const next = tick(state, 1500);

    expect(next.blackMs).toBe(0);
    expect(next.whiteMs).toBe(300000);
    expect(next.winner).toBe('white');
    expect(next.isRunning).toBe(false);
  });

  test('switchTurn only works while running and without winner', () => {
    const running = runningState({ activePlayer: 'white' });
    const paused = { ...running, isRunning: false };

    expect(switchTurn(running).activePlayer).toBe('black');
    expect(switchTurn(paused).activePlayer).toBe('white');
    expect(switchTurn({ ...running, winner: 'black' }).activePlayer).toBe('white');
  });

  test('resetTimer returns paused baseline state', () => {
    const next = resetTimer(5 * 60 * 1000);

    expect(next).toEqual({
      whiteMs: 300000,
      blackMs: 300000,
      activePlayer: 'white',
      isRunning: false,
      winner: null,
    });
  });

  test('selectActivePlayer only works while paused and without winner', () => {
    const paused = resetTimer(300000);
    const running = { ...paused, isRunning: true };

    expect(selectActivePlayer(paused, 'black').activePlayer).toBe('black');
    expect(selectActivePlayer(running, 'black').activePlayer).toBe('white');
    expect(selectActivePlayer({ ...paused, winner: 'black' }, 'black').activePlayer).toBe('white');
  });

  test('toggleStartPause toggles only when game has no winner', () => {
    const paused = resetTimer(300000);

    expect(toggleStartPause(paused).isRunning).toBe(true);
    expect(toggleStartPause({ ...paused, isRunning: true }).isRunning).toBe(false);
    expect(toggleStartPause({ ...paused, winner: 'white' }).isRunning).toBe(false);
  });
});
