import { MaterialIcons } from "@expo/vector-icons"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React from "react"
import { Image, KeyboardAvoidingView, Platform, TouchableOpacity, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { LanguageSelectorModal } from "@/shared/ui/LanguageSelectorModal"
import { LoginForm } from "@/features/auth/ui/components/LoginForm"
import { VerifyCodeForm } from "@/features/auth/ui/components/VerifyCodeForm"
import { RootStackParamList } from "@/app/navigation/types"
import { useLoginScreenVM } from "@/features/auth/vm/useLoginScreenVM"

export const LoginScreen = ({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "Login">): React.JSX.Element => {
    const { state, actions } = useLoginScreenVM()

    return (
        <SafeAreaView className="flex-1 bg-black">
            <Image
                className="absolute inset-0 h-full w-full"
                resizeMode="cover"
                source={require("../../../../../assets/images/bg-image.png")}
            />

            <TouchableOpacity
                accessibilityLabel="Change language"
                className={
                    Platform.OS === "ios"
                        ? "absolute right-3 top-14 z-10 p-2"
                        : "absolute right-3 top-6 z-10 p-2"
                }
                onPress={actions.openLanguageSelector}
            >
                <MaterialIcons color="#FFFFFF" name="language" size={28} />
            </TouchableOpacity>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1 justify-center"
                keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
            >
                <View className="w-full items-center justify-center">
                    {state.mode === "email" ? (
                        <LoginForm
                            email={state.email}
                            emailErrorText={state.emailErrorText}
                            privacyPolicyChecked={state.privacyPolicyChecked}
                            sendingOtp={state.sendingOtp}
                            onChangeEmail={actions.setEmail}
                            onTogglePrivacy={actions.togglePrivacy}
                            onPrivacyPress={() => navigation.navigate("Privacy")}
                            onSubmitEmail={actions.submitEmail}
                            onDemoLogin={actions.loginDemo}
                        />
                    ) : (
                        <VerifyCodeForm
                            otpCode={state.otpCode}
                            otpFieldErrorText={state.otpFieldErrorText}
                            globalErrorText={state.globalErrorText}
                            isExpoGo={state.isExpoGo}
                            onChangeOtpCode={actions.setOtpCode}
                            onVerifyCode={actions.submitOtp}
                            onSendOtp={actions.resendOtp}
                            onUseClipboardLink={actions.useClipboardLink}
                            onBack={actions.backToEmail}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>

            <LanguageSelectorModal
                visible={state.languageSelectorVisible}
                onClose={actions.closeLanguageSelector}
            />
        </SafeAreaView>
    )
}
