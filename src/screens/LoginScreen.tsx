import { MaterialIcons } from "@expo/vector-icons"
import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { useState } from "react"
import { Image, KeyboardAvoidingView, Platform, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button } from "@/components/ui/button"
import { LanguageSelectorModal } from "../components/LanguageSelectorModal"
import { LoginBox } from "../components/login/LoginBox"
import { VerifyCodeBox } from "../components/login/VerifyCodeBox"
import { RootStackParamList } from "../navigation/types"
import { useUser } from "../state/UserContext"
import { createDemoUser } from "../types/user"

export function LoginScreen({
    navigation,
}: NativeStackScreenProps<RootStackParamList, "Login">): React.JSX.Element {
    const [sentOtp, setSentOtp] = useState(false)
    const [email, setEmail] = useState("")
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)
    const { setUser, loginWithToken } = useUser()

    const handleTokenLogin = async (nextEmail: string, accessToken: string) => {
        return loginWithToken(nextEmail, accessToken)
    }

    return (
        <SafeAreaView className="flex-1 bg-black">
            <Image
                className="absolute inset-0 h-full w-full"
                resizeMode="cover"
                source={require("../../assets/images/bg-image.png")}
            />

            <Button
                accessibilityLabel="Change language"
                className={
                    Platform.OS === "ios"
                        ? "absolute right-3 top-14 z-10 h-11 w-11 p-0"
                        : "absolute right-3 top-6 z-10 h-11 w-11 p-0"
                }
                androidRipple={{ color: "rgba(255, 255, 255, 0.18)", borderless: true }}
                haptic="selection"
                hitSlop={8}
                nativeFeedback="scale"
                size="icon"
                variant="ghost"
                onPress={() => setLanguageSelectorVisible(true)}
            >
                <MaterialIcons color="#ffffff" name="language" size={28} />
            </Button>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1 justify-center"
                keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
            >
                <View className="w-full items-center justify-center">
                    {!sentOtp ? (
                        <LoginBox
                            onDemoLogin={() => {
                                setUser(createDemoUser())
                            }}
                            onOtpRequested={nextEmail => {
                                setSentOtp(true)
                                setEmail(nextEmail)
                            }}
                            onPrivacyPress={() => navigation.navigate("Privacy")}
                            onLoginWithToken={handleTokenLogin}
                        />
                    ) : (
                        <VerifyCodeBox
                            email={email}
                            onBack={() => {
                                setSentOtp(false)
                            }}
                            onLoginWithToken={accessToken => handleTokenLogin(email, accessToken)}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>

            <LanguageSelectorModal
                visible={languageSelectorVisible}
                onClose={() => setLanguageSelectorVisible(false)}
            />
        </SafeAreaView>
    )
}
