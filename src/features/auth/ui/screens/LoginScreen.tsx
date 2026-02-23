import { BlurView } from "expo-blur"
import { useRouter } from "expo-router"
import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { KeyboardAvoidingView, View } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useSession } from "@/app/providers/SessionProvider"
import { LoginForm } from "@/features/auth/ui/components/LoginForm"
import { VerifyCodeForm } from "@/features/auth/ui/components/VerifyCodeForm"
import { useDeepLinkLogin } from "@/features/auth/vm/useDeepLinkLogin"
import { useLoginForm } from "@/features/auth/vm/useLoginForm"
import { themeColors } from "@/shared/theme/colors"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"

export const LoginScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const router = useRouter()
    const { user, isAnonymous } = useSession()
    const insets = useSafeAreaInsets()
    const form = useLoginForm()
    useDeepLinkLogin(form.mode, form.performTokenLogin)

    useEffect(() => {
        if (user || isAnonymous) {
            router.replace("/(tabs)/kontroll")
        }
    }, [isAnonymous, router, user])

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            <View className="px-4 pb-2" style={{ paddingTop: Math.max(insets.top + 10, 56) }}>
                <View className="relative overflow-hidden rounded-3xl border border-surface/70 px-4 py-5">
                    <View className="absolute -left-10 -top-14 h-44 w-44 rounded-full bg-state-info/40" />
                    <View className="absolute -bottom-14 -right-10 h-44 w-44 rounded-full bg-state-danger/40" />
                    <View className="absolute left-20 top-8 h-32 w-32 rounded-full bg-link/30" />
                    <BlurView className="absolute inset-0" intensity={42} tint="light" />
                    <Text
                        className="text-5xl leading-tight font-black text-editorial-ink"
                        style={{
                            textShadowColor: themeColors.link,
                            textShadowOffset: { width: 0, height: 3 },
                            textShadowRadius: 14,
                        }}
                    >
                        Velkommen til
                    </Text>
                    <Text
                        className="text-6xl leading-tight font-black text-editorial-ink"
                        style={{
                            textShadowColor: themeColors.stateDanger,
                            textShadowOffset: { width: 0, height: 4 },
                            textShadowRadius: 16,
                        }}
                    >
                        Kvarteret
                    </Text>
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
    )
}
