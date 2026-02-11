import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';

type GameMode = 'd6' | 'chess';
type ChessPlayer = 'white' | 'black';

const INITIAL_CHESS_MS = 5 * 60 * 1000;

function formatClock(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function rollD6(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function GamesScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Games'>): React.JSX.Element {
  const { t } = useTranslation();
  const [mode, setMode] = useState<GameMode>('d6');

  const [diceValue, setDiceValue] = useState(1);
  const [diceRollCount, setDiceRollCount] = useState(0);

  const [whiteMs, setWhiteMs] = useState(INITIAL_CHESS_MS);
  const [blackMs, setBlackMs] = useState(INITIAL_CHESS_MS);
  const [activePlayer, setActivePlayer] = useState<ChessPlayer>('white');
  const [isRunning, setIsRunning] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('gamesTitle') });
  }, [navigation, t]);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const timer = setInterval(() => {
      if (activePlayer === 'white') {
        setWhiteMs((previous) => Math.max(0, previous - 1000));
        return;
      }

      setBlackMs((previous) => Math.max(0, previous - 1000));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [activePlayer, isRunning]);

  useEffect(() => {
    if (whiteMs === 0 || blackMs === 0) {
      setIsRunning(false);
    }
  }, [whiteMs, blackMs]);

  const handleRollDice = (): void => {
    setDiceValue(rollD6());
    setDiceRollCount((previous) => previous + 1);
  };

  const handleToggleTimer = (): void => {
    if (whiteMs === 0 || blackMs === 0) {
      setWhiteMs(INITIAL_CHESS_MS);
      setBlackMs(INITIAL_CHESS_MS);
      setActivePlayer('white');
      setIsRunning(true);
      return;
    }

    setIsRunning((previous) => !previous);
  };

  const handleSwitchTurn = (): void => {
    setActivePlayer((previous) => (previous === 'white' ? 'black' : 'white'));
  };

  const handleResetTimer = (): void => {
    setWhiteMs(INITIAL_CHESS_MS);
    setBlackMs(INITIAL_CHESS_MS);
    setActivePlayer('white');
    setIsRunning(false);
  };

  const handlePressPlayer = (player: ChessPlayer): void => {
    if (!isRunning) {
      setActivePlayer(player);
      return;
    }

    if (player === activePlayer) {
      handleSwitchTurn();
    }
  };

  const winnerLabel =
    whiteMs === 0
      ? t('chessWinner', { winner: t('chessBlack') })
      : blackMs === 0
        ? t('chessWinner', { winner: t('chessWhite') })
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
              style={[styles.clockCard, activePlayer === 'white' ? styles.clockCardActive : null]}
              onPress={() => handlePressPlayer('white')}
            >
              <Text style={styles.clockLabel}>{t('chessWhite')}</Text>
              <Text style={styles.clockValue}>{formatClock(whiteMs)}</Text>
            </Pressable>

            <Pressable
              style={[styles.clockCard, activePlayer === 'black' ? styles.clockCardActive : null]}
              onPress={() => handlePressPlayer('black')}
            >
              <Text style={styles.clockLabel}>{t('chessBlack')}</Text>
              <Text style={styles.clockValue}>{formatClock(blackMs)}</Text>
            </Pressable>

            {winnerLabel ? <Text style={styles.winnerText}>{winnerLabel}</Text> : null}

            <View style={styles.actionsRow}>
              <Pressable style={styles.primaryButton} onPress={handleToggleTimer}>
                <Text style={styles.primaryButtonText}>{isRunning ? t('chessPause') : t('chessStart')}</Text>
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={handleSwitchTurn}>
                <Text style={styles.secondaryButtonText}>{t('chessSwitchTurn')}</Text>
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
