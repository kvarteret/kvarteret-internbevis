import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';
import { extractFriendlyErrorMessage, requestAccessToken } from '../../services/authService';
import { extractAccessTokenFromManualInput, extractAccessTokenFromUrl } from '../../services/deepLinkService';
import { AppButton } from '../common/AppButton';
import { AppTextField } from '../common/AppTextField';

interface VerifyCodeBoxProps {
  email: string;
  onBack: () => void;
  onLoginWithToken: (
    accessToken: string,
  ) => Promise<{ success: boolean; message?: string }>;
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
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>{t('verifyEmail')}</Text>
        <View style={styles.separator} />
        <Text style={styles.subtitle}>{t('enterCodeFromEmail')}</Text>
        {isExpoGo ? <Text style={styles.expoGoHint}>{t('expoGoHint')}</Text> : null}

        <View style={styles.form}>
          <AppTextField
            errorText={otpFieldErrorText}
            icon="lock"
            placeholder={t('codeFromEmail')}
            value={otpCode}
            onChangeText={setOtpCode}
          />

          {globalErrorText ? <Text style={styles.globalErrorText}>{globalErrorText}</Text> : null}

          <View style={styles.buttonGroup}>
            <AppButton text={t('confirm')} onPress={() => void handleVerifyCode()} />
            <AppButton secondary text={t('sendNewCode')} onPress={() => void handleSendOtp()} />
            {isExpoGo ? (
              <AppButton
                secondary
                text={t('useLinkFromClipboard')}
                onPress={() => void handleUseClipboardLink()}
              />
            ) : null}
            <AppButton secondary text={t('back')} onPress={onBack} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    width: '100%',
  },
  scrollContainer: {
    width: '100%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '500',
    color: colors.primaryText,
  },
  separator: {
    marginTop: 10,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryText,
    marginHorizontal: 20,
  },
  subtitle: {
    textAlign: 'center',
    color: colors.primaryText,
  },
  expoGoHint: {
    marginTop: 10,
    textAlign: 'center',
    color: colors.gray700,
    fontSize: 13,
  },
  form: {
    marginTop: 30,
    gap: 16,
  },
  globalErrorText: {
    color: '#B91C1C',
    fontSize: 13,
  },
  buttonGroup: {
    gap: 12,
  },
});
