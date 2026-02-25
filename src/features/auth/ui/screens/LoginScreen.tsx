import { GlassView, isGlassEffectAPIAvailable } from "expo-glass-effect";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useSession } from "@/app/providers/SessionProvider";
import { LoginForm } from "@/features/auth/ui/components/LoginForm";
import { VerifyCodeForm } from "@/features/auth/ui/components/VerifyCodeForm";
import { useDeepLinkLogin } from "@/features/auth/vm/useDeepLinkLogin";
import { useLoginForm } from "@/features/auth/vm/useLoginForm";
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter";
import { Text } from "@/shared/ui/Text";

export const LoginScreen = (): React.JSX.Element => {
  const router = useRouter();
  const { user, isAnonymous } = useSession();
  const insets = useSafeAreaInsets();
  const form = useLoginForm();
  useDeepLinkLogin(form.mode, form.performTokenLogin);
  const useGlassHeroOverlay =
    Platform.OS === "ios" && isGlassEffectAPIAvailable();

  useEffect(() => {
    if (user || isAnonymous) {
      router.replace("/(tabs)/kontroll");
    }
  }, [isAnonymous, router, user]);

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["left", "right", "bottom"]}
    >
      <View
        className="px-4 pb-2"
        style={{ paddingTop: Math.max(insets.top + 10, 56) }}
      >
        <View className="relative overflow-hidden rounded-3xl border border-surface/70 px-4 py-5">
          {useGlassHeroOverlay ? (
            <GlassView
              colorScheme="light"
              glassEffectStyle="regular"
              pointerEvents="none"
              style={StyleSheet.absoluteFillObject}
            />
          ) : (
            <View
              className="absolute inset-0"
              pointerEvents="none"
              style={{ backgroundColor: "rgba(255,255,255,0.34)" }}
            />
          )}
          <View className="gap-1.5">
            <Text className="text-3xl leading-tight font-black text-editorial-ink">
              VELKOMMEN TIL
            </Text>
            <View className="flex-row items-start gap-2">
              <View className="h-[84px] justify-center">
                <Image
                  accessible={false}
                  className="h-[67px]"
                  resizeMode="contain"
                  style={{ aspectRatio: 352 / 224 }}
                  source={require("@assets/images/nobg.png")}
                />
              </View>
              <View className="flex">
                <Text className="text-xl leading-7 font-black text-editorial-ink">
                  DET
                </Text>
                <Text className="text-xl leading-7 font-black text-editorial-ink">
                  AKADEMISKE
                </Text>
                <Text className="text-xl leading-7 font-black text-editorial-ink">
                  KVARTER
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior="padding"
        className="flex-1 justify-center"
        keyboardVerticalOffset={12}
      >
        <View className="w-full items-center justify-center">
          {form.mode === "email" ? (
            <LoginForm
              email={form.email}
              emailErrorText={form.emailErrorText}
              privacyPolicyChecked={form.privacyPolicyChecked}
              sendingOtp={form.sendingOtp}
              onChangeEmail={form.setEmail}
              onTogglePrivacy={form.togglePrivacy}
              onPrivacyPress={() => router.push("/privacy")}
              onSubmitEmail={form.submitEmail}
              onDemoLogin={form.loginDemo}
              onContinueAnonymous={form.continueAnonymous}
              showDemoButton={form.showDemoButton}
            />
          ) : (
            <VerifyCodeForm
              otpCode={form.otpCode}
              otpFieldErrorText={form.otpFieldErrorText}
              globalErrorText={form.globalErrorText}
              isExpoGo={form.isExpoGo}
              onChangeOtpCode={form.setOtpCode}
              onVerifyCode={form.submitOtp}
              onSendOtp={form.resendOtp}
              onUseClipboardLink={form.useClipboardLink}
              onBack={form.backToEmail}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <EtjenestenFooter />
    </SafeAreaView>
  );
};
