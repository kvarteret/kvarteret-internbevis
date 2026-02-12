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
    <SafeAreaView className="flex-1 bg-background" edges={['left', 'right', 'bottom']}>
      <ScrollView className="flex-1" contentContainerClassName="flex-grow gap-3 p-4">
        {isLoading ? (
          <View className="gap-3 rounded-card border border-border bg-surface p-4">
            <ActivityIndicator color={colors.primaryText} size="large" />
            <Text className="font-inter-medium text-base text-text-primary">{t('nowPlayingLoading')}</Text>
          </View>
        ) : null}

        {error ? (
          <View className="gap-3 rounded-card border border-border bg-surface p-4">
            <Text className="font-inter-medium text-base text-text-primary">{t('nowPlayingError')}</Text>
            <Text className="font-inter text-sm text-text-secondary">{error}</Text>
            <AppButton text={t('nowPlayingRetry')} onPress={() => void loadNowPlaying(true)} />
          </View>
        ) : null}

        {showUnauthorized ? (
          <View className="gap-3 rounded-card border border-border bg-surface p-4">
            <Text className="font-inter-medium text-base text-text-primary">{t('nowPlayingUnauthorized')}</Text>
            <AppButton text={t('nowPlayingConnect')} onPress={() => void handleOpenSpotifyConnect()} />
          </View>
        ) : null}

        {showIdle ? (
          <View className="gap-3 rounded-card border border-border bg-surface p-4">
            <Text className="font-inter-medium text-base text-text-primary">{t('nowPlayingIdle')}</Text>
            <AppButton secondary text={t('nowPlayingRetry')} onPress={() => void loadNowPlaying(true)} />
          </View>
        ) : null}

        {showPlaying ? (
          <View className="flex-row items-center gap-3 rounded-card border border-border bg-surface p-3">
            {nowPlaying.image ? <Image className="h-24 w-24 rounded-lg" source={{ uri: nowPlaying.image }} /> : null}
            <View className="flex-1 gap-2">
              <Text className="font-inter-semibold text-lg text-text-primary">{nowPlaying.name ?? ''}</Text>
              <Text className="font-inter text-sm text-text-secondary">
                {nowPlaying.artists ?? ''}
                {nowPlaying.album ? ` - ${nowPlaying.album}` : ''}
              </Text>

              <View className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
                <View className="h-full rounded-full bg-link" style={{ width: progressWidth }} />
              </View>

              <Text className="font-inter text-xs text-text-secondary">
                {nowPlaying.isPlaying ? t('nowPlayingPlaying') : t('nowPlayingPaused')}
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
