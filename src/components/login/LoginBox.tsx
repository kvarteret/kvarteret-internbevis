import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors } from "../../constants/theme";
import { extractFriendlyErrorMessage, requestAccessToken } from "../../services/authService";
import { consumePendingDeepLinkToken } from "../../services/pendingDeepLinkToken";
import { AppButton } from "../common/AppButton";
import { AppTextField } from "../common/AppTextField";

interface LoginBoxProps {
  onOtpRequested: (email: string) => void;
  onDemoLogin: () => void;
  onPrivacyPress: () => void;
  onLoginWithToken: (email: string, accessToken: string) => Promise<{ success: boolean; message?: string }>;
}

function isEmailInputValid(email: string): boolean {
  const normalized = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function LoginBox({
  onOtpRequested,
  onDemoLogin,
  onPrivacyPress,
  onLoginWithToken,
}: LoginBoxProps): React.JSX.Element {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [emailErrorText, setEmailErrorText] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [privacyPolicyChecked, setPrivacyPolicyChecked] = useState(false);

  const normalizedEmail = useMemo(() => email.trim(), [email]);

  const sendOtp = async (): Promise<void> => {
    setEmailErrorText(null);

    if (!privacyPolicyChecked) {
      Alert.alert(t("privacyPolicyConsentAlertHeader"), t("privacyPolicyConsentAlert"));
      return;
    }

    if (!isEmailInputValid(normalizedEmail)) {
      setEmailErrorText(t("invalidEmail"));
      return;
    }

    setSendingOtp(true);

    try {
      const deepLinkToken = consumePendingDeepLinkToken();

      if (deepLinkToken) {
        const deepLinkLoginResult = await onLoginWithToken(normalizedEmail, deepLinkToken);
        if (deepLinkLoginResult.success) {
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
      className="w-full"
      contentContainerClassName="w-full flex-grow items-center justify-center px-4 py-4"
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-[92%] max-w-xl rounded-card border border-white/35 bg-black/55 p-6 shadow-card">
        <Text className="text-center font-inter-bold text-3xl leading-9 text-surface">{t("login")}</Text>

        <View className="mt-6 gap-6">
          <AppTextField
            autoCapitalize="none"
            errorText={emailErrorText}
            icon="mail"
            keyboardType="email-address"
            placeholder={t("emailHint")}
            value={email}
            onChangeText={setEmail}
          />

          {sendingOtp ? (
            <View className="my-2">
              <ActivityIndicator color={colors.white} size="small" />
            </View>
          ) : (
            <View className="gap-3">
              <AppButton text={t("login")} onPress={() => void sendOtp()} />
              <AppButton secondary text={t("tryDemo")} onPress={onDemoLogin} />
            </View>
          )}

          <View className="flex-row items-start">
            <TouchableOpacity
              accessibilityRole="checkbox"
              accessibilityState={{ checked: privacyPolicyChecked }}
              className="mt-1"
              onPress={() => setPrivacyPolicyChecked(previous => !previous)}
            >
              <View
                className={[
                  "h-5 w-5 items-center justify-center rounded border border-white/70 bg-transparent",
                  privacyPolicyChecked ? "border-text-primary bg-text-primary" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {privacyPolicyChecked ? (
                  <Text className="font-inter-bold text-sm leading-3 text-surface">✓</Text>
                ) : null}
              </View>
            </TouchableOpacity>

            <Pressable className="ml-3 flex-1" onPress={onPrivacyPress}>
              <Text className="font-inter text-xs text-link underline">{t("privacyPolicyConsent")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
