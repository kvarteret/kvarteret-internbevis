import { MaterialIcons } from "@expo/vector-icons"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React from "react"
import { Image, KeyboardAvoidingView, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { RootStackParamList } from "@/app/navigation/types"
import { LoginForm } from "@/features/auth/ui/components/LoginForm"
import { VerifyCodeForm } from "@/features/auth/ui/components/VerifyCodeForm"
import { useDeepLinkLogin } from "@/features/auth/vm/useDeepLinkLogin"
import { useLoginForm } from "@/features/auth/vm/useLoginForm"
import { LanguageSelectorModal } from "@/shared/ui/LanguageSelectorModal"

export const LoginScreen = ({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "Login">): React.JSX.Element => {
    const form = useLoginForm()
    useDeepLinkLogin(form.mode, form.performTokenLogin)

    return (
        <SafeAreaView className="flex-1 bg-black">
            <Image
                className="absolute inset-0 h-full w-full"
                resizeMode="cover"
                source={require("@assets/images/bg-image.png")}
            />

            <TouchableOpacity
                accessibilityLabel="Change language"
                className="absolute right-3 top-6 z-10 p-2"
                onPress={form.openLanguageSelector}
            >
                <MaterialIcons color="#FFFFFF" name="language" size={28} />
            </TouchableOpacity>

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
                            onPrivacyPress={() => navigation.navigate("Privacy")}
                            onSubmitEmail={form.submitEmail}
                            onDemoLogin={form.loginDemo}
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

            <LanguageSelectorModal
                visible={form.languageSelectorVisible}
                onClose={form.closeLanguageSelector}
            />
        </SafeAreaView>
    )
}
