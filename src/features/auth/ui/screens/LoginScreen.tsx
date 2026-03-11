import { useRouter } from "expo-router"
import React, { useEffect } from "react"
import { Image, KeyboardAvoidingView, View, ViewStyle } from "react-native"
import { SafeAreaView, useSafeAreaInsets } from "@/shared/ui/interop"
import { useSession } from "@/app/providers/SessionProvider"
import { LoginForm } from "@/features/auth/ui/components/LoginForm"
import { VerifyCodeForm } from "@/features/auth/ui/components/VerifyCodeForm"
import { useDeepLinkLogin } from "@/features/auth/vm/useDeepLinkLogin"
import { useLoginForm } from "@/features/auth/vm/useLoginForm"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"

const BRUTAL_HERO_STYLE: ViewStyle = {
    boxShadow: "8px 8px 0px #111827",
}

export const LoginScreen = (): React.JSX.Element => {
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
                <View
                    className="overflow-hidden border-2 border-editorial-ink bg-brand-primary px-5 py-5"
                    style={BRUTAL_HERO_STYLE}
                >
                    <View className="gap-2.5">
                        <Text className="text-xl font-black uppercase text-editorial-ink">
                            Det er os en Glæde at byde Dem velkommen til
                        </Text>
                        <View className="flex-row items-center gap-4">
                            <View className="w-28 shrink-0 items-center justify-center">
                                <Image
                                    accessible={false}
                                    className="h-28 w-28"
                                    resizeMode="contain"
                                    source={require("@assets/images/nobg.png")}
                                />
                            </View>
                            <View className="flex-1 justify-center gap-0.5">
                                <Text className="text-2xl leading-none font-black uppercase tracking-wider text-editorial-ink">
                                    DET
                                </Text>
                                <Text className="text-2xl leading-none font-black uppercase tracking-wider text-editorial-ink">
                                    AKADEMISKE
                                </Text>
                                <Text className="text-2xl leading-none font-black uppercase tracking-wider text-editorial-ink">
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
    )
}
