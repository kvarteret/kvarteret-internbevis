import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';
import {
  ChessPlayer,
  ChessTimerState,
  resetTimer,
  selectActivePlayer,
  switchTurn,
  tick,
  toggleStartPause,
} from '../utils/chessTimer';

type GameMode = 'd6' | 'chess';

const INITIAL_CHESS_MS = 5 * 60 * 1000;
const TIMER_POLL_INTERVAL_MS = 200;

function formatClock(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function getWinnerLabelKey(winner: ChessPlayer): 'chessWhite' | 'chessBlack' {
  return winner === 'white' ? 'chessWhite' : 'chessBlack';
}

export function GamesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Games'>): React.JSX.Element {
  const { t } = useTranslation();
  const [mode, setMode] = useState<GameMode>('d6');

  const [diceValue, setDiceValue] = useState(1);
  const [diceRollCount, setDiceRollCount] = useState(0);

  const [timerState, setTimerState] = useState<ChessTimerState>(() => resetTimer(INITIAL_CHESS_MS));

  const timerStateRef = useRef(timerState);
  const lastTickAtRef = useRef<number | null>(null);

  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('gamesTitle') });
  }, [navigation, t]);

  const applyElapsed = useCallback((now: number): void => {
    setTimerState((previous) => {
      if (!previous.isRunning || previous.winner) {
        return previous;
      }

      const lastTickAt = lastTickAtRef.current ?? now;
      const elapsed = Math.max(0, now - lastTickAt);
      lastTickAtRef.current = now;

      if (elapsed === 0) {
        return previous;
      }

      return tick(previous, elapsed);
    });
  }, []);

  const pauseWithElapsed = useCallback((): void => {
    const now = Date.now();
    setTimerState((previous) => {
      if (!previous.isRunning || previous.winner) {
        return previous;
      }

      const lastTickAt = lastTickAtRef.current ?? now;
      const elapsed = Math.max(0, now - lastTickAt);
      const next = elapsed > 0 ? tick(previous, elapsed) : previous;
      return next.isRunning ? toggleStartPause(next) : next;
    });
    lastTickAtRef.current = null;
  }, []);

  useEffect(() => {
    if (!timerState.isRunning || timerState.winner) {
      lastTickAtRef.current = null;
      return;
    }

    lastTickAtRef.current = Date.now();

    const timer = setInterval(() => {
      applyElapsed(Date.now());
    }, TIMER_POLL_INTERVAL_MS);

    return () => {
      clearInterval(timer);
    };
  }, [applyElapsed, timerState.isRunning, timerState.winner]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' && timerStateRef.current.isRunning) {
        pauseWithElapsed();
      }

      if (nextState === 'active') {
        lastTickAtRef.current = null;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [pauseWithElapsed]);

  const handleRollDice = (): void => {
    setDiceValue(rollD6());
    setDiceRollCount((previous) => previous + 1);
  };

  const handleToggleTimer = (): void => {
    if (timerState.winner) {
      setTimerState(resetTimer(INITIAL_CHESS_MS));
      lastTickAtRef.current = null;
      return;
    }

    if (timerState.isRunning) {
      pauseWithElapsed();
      return;
    }

    lastTickAtRef.current = Date.now();
    setTimerState((previous) => toggleStartPause(previous));
  };

  const handleResetTimer = (): void => {
    setTimerState(resetTimer(INITIAL_CHESS_MS));
    lastTickAtRef.current = null;
  };

  const handlePressPlayer = (player: ChessPlayer): void => {
    setTimerState((previous) => {
      if (previous.winner) {
        return previous;
      }

      if (!previous.isRunning) {
        return selectActivePlayer(previous, player);
      }

      if (player !== previous.activePlayer) {
        return previous;
      }

      const now = Date.now();
      const lastTickAt = lastTickAtRef.current ?? now;
      const elapsed = Math.max(0, now - lastTickAt);
      const withElapsed = elapsed > 0 ? tick(previous, elapsed) : previous;

      if (withElapsed.winner || !withElapsed.isRunning) {
        lastTickAtRef.current = null;
        return withElapsed;
      }

      lastTickAtRef.current = now;
      return switchTurn(withElapsed);
    });
  };

  const winnerLabel = timerState.winner
    ? t('chessWinner', { winner: t(getWinnerLabelKey(timerState.winner)) })
    : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.modeRow}>
          <Pressable
            style={[styles.modeButton, mode === 'd6' ? styles.modeButtonActive : null]}
            onPress={() => setMode('d6')}
          >
            <Text style={[styles.modeText, mode === 'd6' ? styles.modeTextActive : null]}>{t('gamesDice')}</Text>
          </Pressable>
          <Pressable
            style={[styles.modeButton, mode === 'chess' ? styles.modeButtonActive : null]}
            onPress={() => setMode('chess')}
          >
            <Text style={[styles.modeText, mode === 'chess' ? styles.modeTextActive : null]}>{t('gamesChessTimer')}</Text>
          </Pressable>
        </View>

        {mode === 'd6' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('gamesDice')}</Text>
            <Text style={styles.diceValue}>{diceValue}</Text>
            <Text style={styles.metaText}>{t('gamesDiceRolls', { count: diceRollCount })}</Text>

            <Pressable style={styles.primaryButton} onPress={handleRollDice}>
              <Text style={styles.primaryButtonText}>{t('gamesRollD6')}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('gamesChessTimer')}</Text>

            <Pressable
              style={[styles.clockCard, timerState.activePlayer === 'white' ? styles.clockCardActive : null]}
              onPress={() => handlePressPlayer('white')}
            >
              <Text style={styles.clockLabel}>{t('chessWhite')}</Text>
              <Text style={styles.clockValue}>{formatClock(timerState.whiteMs)}</Text>
            </Pressable>

            <Pressable
              style={[styles.clockCard, timerState.activePlayer === 'black' ? styles.clockCardActive : null]}
              onPress={() => handlePressPlayer('black')}
            >
              <Text style={styles.clockLabel}>{t('chessBlack')}</Text>
              <Text style={styles.clockValue}>{formatClock(timerState.blackMs)}</Text>
            </Pressable>

            {winnerLabel ? <Text style={styles.winnerText}>{winnerLabel}</Text> : null}

            <View style={styles.actionsRow}>
              <Pressable style={styles.primaryButton} onPress={handleToggleTimer}>
                <Text style={styles.primaryButtonText}>{timerState.isRunning ? t('chessPause') : t('chessStart')}</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={handleResetTimer}>
                <Text style={styles.secondaryButtonText}>{t('chessReset')}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 16,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 10,
    backgroundColor: colors.white,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primaryText,
    borderColor: colors.primaryText,
  },
  modeText: {
    color: colors.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
  modeTextActive: {
    color: colors.white,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 12,
    backgroundColor: colors.white,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primaryText,
  },
  diceValue: {
    textAlign: 'center',
    fontSize: 72,
    fontWeight: '700',
    color: colors.primaryText,
  },
  metaText: {
    textAlign: 'center',
    color: colors.gray700,
    fontSize: 14,
  },
  clockCard: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 10,
    padding: 14,
    backgroundColor: colors.gray100,
  },
  clockCardActive: {
    borderColor: colors.secondary,
    backgroundColor: '#EAF7E6',
  },
  clockLabel: {
    fontSize: 14,
    color: colors.gray700,
    marginBottom: 6,
  },
  clockValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primaryText,
  },
  winnerText: {
    fontSize: 16,
    color: colors.secondary,
    fontWeight: '700',
  },
  actionsRow: {
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    borderRadius: 10,
    backgroundColor: colors.primaryText,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
});
