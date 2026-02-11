import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';
import {
  clearDeepLinkToken,
  extractFriendlyErrorMessage,
  getDeepLinkToken,
  requestAccessToken,
} from '../../services/authService';
import { AppButton } from '../common/AppButton';
import { AppTextField } from '../common/AppTextField';

interface LoginBoxProps {
  onOtpRequested: (email: string) => void;
  onDemoLogin: () => void;
  onPrivacyPress: () => void;
  onLoginWithToken: (email: string, accessToken: string) => Promise<boolean>;
}

function isEmailInputValid(email: string): boolean {
  const normalized = email.trim();
  return normalized.length > 0 && normalized.includes('@');
}

export function LoginBox({
  onOtpRequested,
  onDemoLogin,
  onPrivacyPress,
  onLoginWithToken,
}: LoginBoxProps): React.JSX.Element {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [emailErrorText, setEmailErrorText] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [privacyPolicyChecked, setPrivacyPolicyChecked] = useState(false);

  const normalizedEmail = useMemo(() => email.trim(), [email]);

  const sendOtp = async (): Promise<void> => {
    setEmailErrorText(null);

    if (!privacyPolicyChecked) {
      Alert.alert(t('privacyPolicyConsentAlertHeader'), t('privacyPolicyConsentAlert'));
      return;
    }

    if (!isEmailInputValid(normalizedEmail)) {
      setEmailErrorText(t('emailHint'));
      return;
    }

    setSendingOtp(true);

    try {
      const deepLinkToken = await getDeepLinkToken();

      if (deepLinkToken) {
        const deepLinkLoginSuccess = await onLoginWithToken(normalizedEmail, deepLinkToken);
        if (deepLinkLoginSuccess) {
          await clearDeepLinkToken();
          return;
        }
      }

      await requestAccessToken(normalizedEmail);
      onOtpRequested(normalizedEmail);
    } catch (error) {
      setEmailErrorText(extractFriendlyErrorMessage(error));
    } finally {
      setSendingOtp(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>{t('login')}</Text>
        <View style={styles.fields}>
          <AppTextField
            autoCapitalize="none"
            errorText={emailErrorText}
            icon="mail"
            keyboardType="email-address"
            placeholder={t('emailHint')}
            value={email}
            onChangeText={setEmail}
          />

          {sendingOtp ? (
            <ActivityIndicator color={colors.primaryText} size="small" style={styles.loading} />
          ) : (
            <View style={styles.buttonGroup}>
              <AppButton text={t('login')} onPress={() => void sendOtp()} />
              <AppButton secondary text={t('tryDemo')} onPress={onDemoLogin} />
            </View>
          )}

          <View style={styles.policyRow}>
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: privacyPolicyChecked }}
              style={styles.checkbox}
              onPress={() => setPrivacyPolicyChecked((previous) => !previous)}
            >
              <View style={[styles.checkboxSquare, privacyPolicyChecked ? styles.checkboxChecked : null]}>
                {privacyPolicyChecked ? <Text style={styles.checkboxTick}>✓</Text> : null}
              </View>
            </TouchableOpacity>
            <Pressable onPress={onPrivacyPress} style={styles.policyButton}>
              <Text style={styles.policyText}>{t('privacyPolicyConsent')}</Text>
            </Pressable>
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
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: colors.primaryText,
  },
  fields: {
    marginTop: 24,
    gap: 24,
  },
  buttonGroup: {
    gap: 12,
  },
  loading: {
    marginVertical: 8,
  },
  policyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    marginTop: 4,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderColor: colors.gray600,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  checkboxChecked: {
    backgroundColor: colors.primaryText,
    borderColor: colors.primaryText,
  },
  checkboxTick: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 14,
  },
  policyButton: {
    marginLeft: 12,
    flex: 1,
  },
  policyText: {
    fontSize: 12,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
});
