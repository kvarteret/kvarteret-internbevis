import { BlurView } from "expo-blur"
import { useRouter } from "expo-router"
import React, { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { KeyboardAvoidingView, TouchableOpacity, View } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useSession } from "@/app/providers/SessionProvider"
import { openExternalUrl } from "@/core/linking/linkClient"
import { LoginForm } from "@/features/auth/ui/components/LoginForm"
import { VerifyCodeForm } from "@/features/auth/ui/components/VerifyCodeForm"
import { useDeepLinkLogin } from "@/features/auth/vm/useDeepLinkLogin"
import { useLoginForm } from "@/features/auth/vm/useLoginForm"
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
                <View className="relative overflow-hidden rounded-3xl border border-[#FFFFFFA8] px-4 py-5">
                    <View className="absolute -left-10 -top-14 h-44 w-44 rounded-full bg-[#60A5FA66]" />
                    <View className="absolute -bottom-14 -right-10 h-44 w-44 rounded-full bg-[#F472B666]" />
                    <View className="absolute left-20 top-8 h-32 w-32 rounded-full bg-[#A78BFA55]" />
                    <BlurView className="absolute inset-0" intensity={42} tint="light" />
                    <Text
                        className="text-[46px] leading-[50px] font-black text-[#0F172A]"
                        style={{
                            textShadowColor: "#93C5FD",
                            textShadowOffset: { width: 0, height: 3 },
                            textShadowRadius: 14,
                        }}
                    >
                        Velkommen til
                    </Text>
                    <Text
                        className="text-[52px] leading-[56px] font-black text-[#0F172A]"
                        style={{
                            textShadowColor: "#F9A8D4",
                            textShadowOffset: { width: 0, height: 4 },
                            textShadowRadius: 16,
                        }}
                    >
                        Samfunnet
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

            <View className="w-full items-center justify-center pb-4 pt-2">
                <View className="w-full flex-row flex-nowrap items-center justify-center px-3">
                    <Text
                        adjustsFontSizeToFit
                        className="shrink text-lg leading-6 font-medium"
                        ellipsizeMode="tail"
                        minimumFontScale={0.72}
                        numberOfLines={1}
                    >
                        {t("homeFooterPrefix")}
                    </Text>
                    <Text className="px-1.5 text-2xl leading-8" numberOfLines={1}>
                        |
                    </Text>
                    <TouchableOpacity
                        accessibilityRole="link"
                        className="shrink"
                        onPress={() => void openExternalUrl("https://blifrivillig.no")}
                    >
                        <Text
                            adjustsFontSizeToFit
                            className="text-lg leading-6 underline font-extrabold"
                            ellipsizeMode="tail"
                            minimumFontScale={0.72}
                            numberOfLines={1}
                        >
                            {t("homeFooterVolunteer")}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    )
}
