import { useRouter } from "expo-router"
import React, { useEffect } from "react"
import {
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    useWindowDimensions,
    View,
    ViewStyle,
} from "react-native"
import { useSession } from "@/app/providers/SessionProvider"
import { LoginForm } from "@/features/auth/ui/components/LoginForm"
import { VerifyCodeForm } from "@/features/auth/ui/components/VerifyCodeForm"
import { useDeepLinkLogin } from "@/features/auth/vm/useDeepLinkLogin"
import { useLoginForm } from "@/features/auth/vm/useLoginForm"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { SafeAreaView, useSafeAreaInsets } from "@/shared/ui/interop"
import { Text } from "@/shared/ui/Text"

const BRUTAL_HERO_STYLE: ViewStyle = {
    boxShadow: "8px 8px 0px #111827",
}

export const LoginScreen = (): React.JSX.Element => {
    const router = useRouter()
    const { user, isAnonymous } = useSession()
    const insets = useSafeAreaInsets()
    const { width } = useWindowDimensions()
    const form = useLoginForm()
    const isCompactWidth = width < 390
    useDeepLinkLogin(form.mode, form.performTokenLogin)

    useEffect(() => {
        if (user || isAnonymous) {
            router.replace("/(tabs)/kontroll")
        }
    }, [isAnonymous, router, user])

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
                keyboardVerticalOffset={12}
            >
                <ScrollView
                    automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
                    className="flex-1"
                    contentContainerClassName="items-center px-4"
                    contentContainerStyle={{
                        flexGrow: 1,
                        gap: isCompactWidth ? 20 : 28,
                        paddingTop: Math.max(insets.top + 10, isCompactWidth ? 24 : 40),
                        paddingBottom: Math.max(insets.bottom + 16, 24),
                    }}
                    contentInsetAdjustmentBehavior="automatic"
                    keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        className="w-full max-w-xl overflow-hidden border-2 border-editorial-ink bg-brand-primary"
                        style={[
                            BRUTAL_HERO_STYLE,
                            {
                                paddingHorizontal: isCompactWidth ? 18 : 20,
                                paddingVertical: isCompactWidth ? 18 : 20,
                            },
                        ]}
                    >
                        <View className={isCompactWidth ? "gap-3" : "gap-2.5"}>
                            <Text
                                className={`font-black uppercase text-editorial-ink ${isCompactWidth ? "text-lg leading-6" : "text-xl"}`}
                            >
                                Det er os en Glæde at byde Dem velkommen til
                            </Text>
                            <View
                                className={`flex-row items-center ${isCompactWidth ? "gap-3" : "gap-4"}`}
                            >
                                <View
                                    className="shrink-0 items-center justify-center"
                                    style={{
                                        width: isCompactWidth ? 86 : 112,
                                    }}
                                >
                                    <Image
                                        accessible={false}
                                        resizeMode="contain"
                                        source={require("@assets/images/nobg.png")}
                                        style={{
                                            height: isCompactWidth ? 86 : 112,
                                            width: isCompactWidth ? 86 : 112,
                                        }}
                                    />
                                </View>
                                <View className="flex-1 justify-center gap-0.5">
                                    <Text
                                        className={`font-black uppercase tracking-wider text-editorial-ink ${isCompactWidth ? "text-xl leading-6" : "text-2xl leading-none"}`}
                                    >
                                        DET
                                    </Text>
                                    <Text
                                        className={`font-black uppercase tracking-wider text-editorial-ink ${isCompactWidth ? "text-xl leading-6" : "text-2xl leading-none"}`}
                                    >
                                        AKADEMISKE
                                    </Text>
                                    <Text
                                        className={`font-black uppercase tracking-wider text-editorial-ink ${isCompactWidth ? "text-xl leading-6" : "text-2xl leading-none"}`}
                                    >
                                        KVARTER
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {form.mode === "email" ? (
                        <LoginForm
                            email={form.email}
                            emailErrorText={form.emailErrorText}
                            sendingOtp={form.sendingOtp}
                            onChangeEmail={form.setEmail}
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

                    <EtjenestenFooter />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
