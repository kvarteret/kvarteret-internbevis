import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { extractFriendlyErrorMessage, requestAccessToken } from '../../services/authService';
import { extractAccessTokenFromManualInput, extractAccessTokenFromUrl } from '../../services/deepLinkService';
import { AppButton } from '../common/AppButton';
import { AppTextField } from '../common/AppTextField';

interface VerifyCodeBoxProps {
  email: string;
  onBack: () => void;
  onLoginWithToken: (accessToken: string) => Promise<{ success: boolean; message?: string }>;
}

export function VerifyCodeBox({ email, onBack, onLoginWithToken }: VerifyCodeBoxProps): React.JSX.Element {
  const { t } = useTranslation();
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  const [otpCode, setOtpCode] = useState('');
  const [otpFieldErrorText, setOtpFieldErrorText] = useState<string | null>(null);
  const [globalErrorText, setGlobalErrorText] = useState<string | null>(null);
  const handlingDeepLinkRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const handleUrl = async (url: string): Promise<void> => {
      if (handlingDeepLinkRef.current || !mounted) {
        return;
      }

      const accessToken = extractAccessTokenFromUrl(url);
      if (!accessToken) {
        return;
      }

      handlingDeepLinkRef.current = true;

      try {
        const result = await onLoginWithToken(accessToken);
        if (!result.success && mounted) {
          setGlobalErrorText(result.message ?? t('invalidAccessToken'));
        }
      } finally {
        handlingDeepLinkRef.current = false;
      }
    };

    void Linking.getInitialURL().then((url: string | null) => {
      if (url) {
        void handleUrl(url);
      }
    });

    const subscription = Linking.addEventListener('url', (event: { url: string }) => {
      void handleUrl(event.url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, [onLoginWithToken, t]);

  const handleVerifyCode = async (): Promise<void> => {
    setOtpFieldErrorText(null);
    setGlobalErrorText(null);

    if (!otpCode.trim()) {
      setOtpFieldErrorText(t('pleaseEnterCode'));
      return;
    }

    const result = await onLoginWithToken(otpCode.trim());
    if (!result.success) {
      setGlobalErrorText(result.message ?? t('couldNotFetchData'));
    }
  };

  const handleSendOtp = async (): Promise<void> => {
    setOtpFieldErrorText(null);
    setGlobalErrorText(null);

    try {
      const success = await requestAccessToken(email);
      if (success) {
        Alert.alert(t('status'), t('newCodeSent'));
      }
    } catch (error) {
      setGlobalErrorText(extractFriendlyErrorMessage(error) || t('couldNotSendCode'));
    }
  };

  const handleUseClipboardLink = async (): Promise<void> => {
    setOtpFieldErrorText(null);
    setGlobalErrorText(null);

    const clipboardText = await Clipboard.getStringAsync();
    const accessToken = extractAccessTokenFromManualInput(clipboardText);

    if (!accessToken) {
      setGlobalErrorText(t('expoGoClipboardNoToken'));
      return;
    }

    const result = await onLoginWithToken(accessToken);
    if (!result.success) {
      setGlobalErrorText(result.message ?? t('invalidAccessToken'));
    }
  };

  return (
    <ScrollView className="w-full" contentContainerClassName="w-full flex-grow items-center justify-center px-4 py-4" keyboardShouldPersistTaps="handled">
      <View className="w-[92%] max-w-xl rounded-2xl border border-white/35 bg-black/55 px-5 py-7">
        <Text className="text-center font-inter-medium text-2xl leading-8 text-surface">{t('verifyEmail')}</Text>

        <View className="mx-5 my-2.5 border-b-2 border-white/70" />

        <Text className="text-center font-inter text-base leading-6 text-surface">{t('enterCodeFromEmail')}</Text>

        {isExpoGo ? <Text className="mt-2.5 text-center font-inter text-[13px] text-white/80">{t('expoGoHint')}</Text> : null}

        <View className="mt-7 gap-4">
          <AppTextField
            errorText={otpFieldErrorText}
            icon="lock"
            placeholder={t('codeFromEmail')}
            value={otpCode}
            onChangeText={setOtpCode}
          />

          {globalErrorText ? <Text className="font-inter text-[13px] text-[#B91C1C]">{globalErrorText}</Text> : null}

          <View className="gap-3">
            <AppButton text={t('confirm')} onPress={() => void handleVerifyCode()} />
            <AppButton secondary text={t('sendNewCode')} onPress={() => void handleSendOtp()} />
            {isExpoGo ? (
              <AppButton secondary text={t('useLinkFromClipboard')} onPress={() => void handleUseClipboardLink()} />
            ) : null}
            <AppButton secondary text={t('back')} onPress={onBack} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
