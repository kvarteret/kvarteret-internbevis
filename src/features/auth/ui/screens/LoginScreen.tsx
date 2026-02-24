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
                    <BlurView className="absolute inset-0" intensity={42} tint="light" />
                    <Text className="text-5xl leading-tight font-black text-editorial-ink">
                        Velkommen til
                    </Text>
                    <Text className="text-6xl leading-tight font-black text-editorial-ink">
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
                    {form.mode === "verify" ? (
                        <VerifyCodeForm
                            authMethod={form.authMethod}
                            otpCode={form.otpCode}
                            otpFieldErrorText={form.otpFieldErrorText}
                            globalErrorText={form.globalErrorText}
                            isExpoGo={form.isExpoGo}
                            onChangeOtpCode={form.setOtpCode}
                            onVerifyCode={form.submitOtp}
                            onSendOtp={form.resendOtp}
                            onUseClipboardLink={form.useClipboardLink}
                            onBack={form.backToPhone}
                            onUseEmailFallback={form.switchToEmailFallback}
                        />
                    ) : (
                        <LoginForm
                            authMethod={form.authMethod}
                            email={form.email}
                            phone={form.phone}
                            emailErrorText={form.emailErrorText}
                            phoneErrorText={form.phoneErrorText}
                            privacyPolicyChecked={form.privacyPolicyChecked}
                            sendingOtp={form.sendingOtp}
                            onChangeEmail={form.setEmail}
                            onChangePhone={form.setPhone}
                            onTogglePrivacy={form.togglePrivacy}
                            onPrivacyPress={() => router.push("/privacy")}
                            onSubmitPhone={form.submitPhone}
                            onSubmitEmail={form.submitEmail}
                            onDemoLogin={form.loginDemo}
                            onContinueAnonymous={form.continueAnonymous}
                            showDemoButton={form.showDemoButton}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>

            <EtjenestenFooter />
        </SafeAreaView>
    )
}
