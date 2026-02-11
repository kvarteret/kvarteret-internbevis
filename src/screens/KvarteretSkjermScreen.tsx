import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  DimensionValue,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { AppButton } from '../components/common/AppButton';
import { colors } from '../constants/theme';
import { RootStackParamList } from '../navigation/types';
import { fetchNowPlaying } from '../services/kvarteretSkjermService';
import { NowPlayingState } from '../types/nowPlaying';

const POLL_INTERVAL_MS = 1000;

function clampProgress(value: number | null): number {
  if (value === null || !Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

export function KvarteretSkjermScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, 'KvarteretSkjerm'>): React.JSX.Element {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingState | null>(null);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({ title: t('kvarteretSkjerm') });
  }, [navigation, t]);

  const stopPolling = useCallback((): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const cancelInFlightRequest = useCallback((): void => {
    if (requestAbortRef.current) {
      requestAbortRef.current.abort();
      requestAbortRef.current = null;
    }
  }, []);

  const loadNowPlaying = useCallback(
    async (showLoader: boolean): Promise<void> => {
      cancelInFlightRequest();
      const controller = new AbortController();
      requestAbortRef.current = controller;

      if (showLoader) {
        setIsLoading(true);
      }

      try {
        const data = await fetchNowPlaying(controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        setNowPlaying(data);
        setError(null);
      } catch (nextError) {
        if (controller.signal.aborted) {
          return;
        }

        const message = nextError instanceof Error ? nextError.message : String(nextError);
        setError(message);
      } finally {
        if (requestAbortRef.current === controller) {
          requestAbortRef.current = null;
        }

        if (showLoader && !controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [cancelInFlightRequest],
  );

  const startPolling = useCallback((): void => {
    if (appStateRef.current !== 'active' || intervalRef.current) {
      return;
    }

    intervalRef.current = setInterval(() => {
      void loadNowPlaying(false);
    }, POLL_INTERVAL_MS);
  }, [loadNowPlaying]);

  useFocusEffect(
    useCallback(() => {
      void loadNowPlaying(true);
      startPolling();

      const subscription = AppState.addEventListener('change', (state) => {
        appStateRef.current = state;

        if (state === 'active') {
          void loadNowPlaying(false);
          startPolling();
          return;
        }

        stopPolling();
        cancelInFlightRequest();
      });

      return () => {
        subscription.remove();
        stopPolling();
        cancelInFlightRequest();
      };
    }, [cancelInFlightRequest, loadNowPlaying, startPolling, stopPolling]),
  );

  const handleOpenSpotifyConnect = async (): Promise<void> => {
    if (!nowPlaying?.connectUrl) {
      return;
    }

    try {
      await Linking.openURL(nowPlaying.connectUrl);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError));
    }
  };

  const progressWidth: DimensionValue = `${clampProgress(nowPlaying?.progressPercent ?? 0)}%`;
  const showUnauthorized = !isLoading && !error && nowPlaying && !nowPlaying.authorized;
  const showIdle = !isLoading && !error && nowPlaying && nowPlaying.authorized && !nowPlaying.playing;
  const showPlaying = !isLoading && !error && nowPlaying && nowPlaying.authorized && nowPlaying.playing;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.container}>
        {isLoading ? (
          <View style={styles.stateCard}>
            <ActivityIndicator size="large" color={colors.primaryText} />
            <Text style={styles.stateText}>{t('nowPlayingLoading')}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{t('nowPlayingError')}</Text>
            <Text style={styles.errorDetail}>{error}</Text>
            <AppButton text={t('nowPlayingRetry')} onPress={() => void loadNowPlaying(true)} />
          </View>
        ) : null}

        {showUnauthorized ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{t('nowPlayingUnauthorized')}</Text>
            <AppButton text={t('nowPlayingConnect')} onPress={() => void handleOpenSpotifyConnect()} />
          </View>
        ) : null}

        {showIdle ? (
          <View style={styles.stateCard}>
            <Text style={styles.stateText}>{t('nowPlayingIdle')}</Text>
            <AppButton secondary text={t('nowPlayingRetry')} onPress={() => void loadNowPlaying(true)} />
          </View>
        ) : null}

        {showPlaying ? (
          <View style={styles.trackCard}>
            {nowPlaying.image ? <Image source={{ uri: nowPlaying.image }} style={styles.coverImage} /> : null}
            <View style={styles.trackDetails}>
              <Text style={styles.trackName}>{nowPlaying.name ?? ''}</Text>
              <Text style={styles.trackMeta}>
                {nowPlaying.artists ?? ''}
                {nowPlaying.album ? ` - ${nowPlaying.album}` : ''}
              </Text>

              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: progressWidth }]} />
              </View>

              <Text style={styles.playStateText}>
                {nowPlaying.isPlaying ? t('nowPlayingPlaying') : t('nowPlayingPaused')}
              </Text>
            </View>
          </View>
        ) : null}
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
    padding: 16,
    flexGrow: 1,
  },
  stateCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    padding: 16,
    gap: 12,
  },
  stateText: {
    color: colors.primaryText,
    fontSize: 16,
  },
  errorDetail: {
    color: colors.gray700,
    fontSize: 14,
  },
  trackCard: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray300,
    padding: 12,
    alignItems: 'center',
  },
  coverImage: {
    width: 96,
    height: 96,
    borderRadius: 8,
  },
  trackDetails: {
    flex: 1,
    gap: 8,
  },
  trackName: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: '600',
  },
  trackMeta: {
    color: colors.gray700,
    fontSize: 14,
  },
  progressBarBackground: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.gray200,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#2563EB',
  },
  playStateText: {
    color: colors.gray700,
    fontSize: 12,
  },
});
