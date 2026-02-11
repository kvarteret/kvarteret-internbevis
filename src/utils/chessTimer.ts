export type ChessPlayer = 'white' | 'black';

export interface ChessTimerState {
  whiteMs: number;
  blackMs: number;
  activePlayer: ChessPlayer;
  isRunning: boolean;
  winner: ChessPlayer | null;
}

function clampMs(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

export function resetTimer(initialMs: number): ChessTimerState {
  const clamped = clampMs(initialMs);
  return {
    whiteMs: clamped,
    blackMs: clamped,
    activePlayer: 'white',
    isRunning: false,
    winner: null,
  };
}

export function tick(state: ChessTimerState, elapsedMs: number): ChessTimerState {
  if (!state.isRunning || state.winner) {
    return state;
  }

  const elapsed = clampMs(elapsedMs);
  if (elapsed === 0) {
    return state;
  }

  if (state.activePlayer === 'white') {
    const whiteMs = clampMs(state.whiteMs - elapsed);
    const winner: ChessPlayer | null = whiteMs === 0 ? 'black' : null;

    return {
      ...state,
      whiteMs,
      winner,
      isRunning: winner ? false : state.isRunning,
    };
  }

  const blackMs = clampMs(state.blackMs - elapsed);
  const winner: ChessPlayer | null = blackMs === 0 ? 'white' : null;

  return {
    ...state,
    blackMs,
    winner,
    isRunning: winner ? false : state.isRunning,
  };
}

export function switchTurn(state: ChessTimerState): ChessTimerState {
  if (!state.isRunning || state.winner) {
    return state;
  }

  return {
    ...state,
    activePlayer: state.activePlayer === 'white' ? 'black' : 'white',
  };
}

export function toggleStartPause(state: ChessTimerState): ChessTimerState {
  if (state.winner) {
    return state;
  }

  return {
    ...state,
    isRunning: !state.isRunning,
  };
}

export function selectActivePlayer(state: ChessTimerState, player: ChessPlayer): ChessTimerState {
  if (state.isRunning || state.winner || state.activePlayer === player) {
    return state;
  }

  return {
    ...state,
    activePlayer: player,
  };
}
