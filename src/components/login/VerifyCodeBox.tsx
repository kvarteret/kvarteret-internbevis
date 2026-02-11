import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';
import { extractFriendlyErrorMessage, requestAccessToken, saveDeepLinkToken } from '../../services/authService';
import { extractAccessTokenFromUrl } from '../../services/deepLinkService';
import { AppButton } from '../common/AppButton';
import { AppTextField } from '../common/AppTextField';

interface VerifyCodeBoxProps {
  email: string;
  onBack: () => void;
  onLoginWithToken: (accessToken: string) => Promise<boolean>;
}

export function VerifyCodeBox({ email, onBack, onLoginWithToken }: VerifyCodeBoxProps): React.JSX.Element {
  const { t } = useTranslation();
  const isExpoGo = Constants.executionEnvironment === 'storeClient';
  const [otpCode, setOtpCode] = useState('');
  const [otpErrorText, setOtpErrorText] = useState<string | null>(null);
  const [attemptedVerification, setAttemptedVerification] = useState(false);
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
        await saveDeepLinkToken(accessToken);
        const success = await onLoginWithToken(accessToken);
        if (!success && mounted) {
          setOtpErrorText(t('invalidAccessToken'));
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
    setOtpErrorText(null);
    setAttemptedVerification(true);

    if (!otpCode.trim()) {
      setOtpErrorText(t('pleaseEnterCode'));
      return;
    }

    const success = await onLoginWithToken(otpCode.trim());
    if (!success) {
      setOtpErrorText(t('couldNotFetchData'));
    }
  };

  const handleSendOtp = async (): Promise<void> => {
    setAttemptedVerification(false);
    setOtpErrorText(null);

    try {
      const success = await requestAccessToken(email);
      if (success) {
        Alert.alert(t('status'), t('newCodeSent'));
      }
    } catch (error) {
      setOtpErrorText(extractFriendlyErrorMessage(error) || t('couldNotSendCode'));
    }
  };

  const handleUseClipboardLink = async (): Promise<void> => {
    setOtpErrorText(null);
    const clipboardText = await Clipboard.getStringAsync();
    const accessToken = extractAccessTokenFromUrl(clipboardText);

    if (!accessToken) {
      setOtpErrorText(t('expoGoClipboardNoToken'));
      return;
    }

    await saveDeepLinkToken(accessToken);
    const success = await onLoginWithToken(accessToken);
    if (!success) {
      setOtpErrorText(t('invalidAccessToken'));
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
            errorText={attemptedVerification ? otpErrorText : null}
            icon="lock"
            placeholder={t('codeFromEmail')}
            value={otpCode}
            onChangeText={setOtpCode}
          />

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
    gap: 28,
  },
  buttonGroup: {
    gap: 12,
  },
});
