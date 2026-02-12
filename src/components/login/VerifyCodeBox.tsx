import * as Clipboard from "expo-clipboard"
import Constants from "expo-constants"
import * as Linking from "expo-linking"
import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Alert, Platform, ScrollView, type TextInputProps, View } from "react-native"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import { extractFriendlyErrorMessage, requestAccessToken } from "../../services/authService"
import {
    extractAccessTokenFromManualInput,
    extractAccessTokenFromUrl,
} from "../../services/deepLinkService"

interface VerifyCodeBoxProps {
    email: string
    onBack: () => void
    onLoginWithToken: (accessToken: string) => Promise<{ success: boolean; message?: string }>
}

export function VerifyCodeBox({
    email,
    onBack,
    onLoginWithToken,
}: VerifyCodeBoxProps): React.JSX.Element {
    const { t } = useTranslation()
    const isExpoGo = Constants.executionEnvironment === "storeClient"
    const [otpCode, setOtpCode] = useState("")
    const [otpFieldErrorText, setOtpFieldErrorText] = useState<string | null>(null)
    const [globalErrorText, setGlobalErrorText] = useState<string | null>(null)
    const handlingDeepLinkRef = useRef(false)
    const otpAutoComplete = Platform.select({
        android: "sms-otp",
        default: "one-time-code",
    }) as TextInputProps["autoComplete"]

    useEffect(() => {
        let mounted = true

        const handleUrl = async (url: string): Promise<void> => {
            if (handlingDeepLinkRef.current || !mounted) {
                return
            }

            const accessToken = extractAccessTokenFromUrl(url)
            if (!accessToken) {
                return
            }

            handlingDeepLinkRef.current = true

            try {
                const result = await onLoginWithToken(accessToken)
                if (!result.success && mounted) {
                    setGlobalErrorText(result.message ?? t("invalidAccessToken"))
                }
            } finally {
                handlingDeepLinkRef.current = false
            }
        }

        void Linking.getInitialURL().then((url: string | null) => {
            if (url) {
                void handleUrl(url)
            }
        })

        const subscription = Linking.addEventListener("url", (event: { url: string }) => {
            void handleUrl(event.url)
        })

        return () => {
            mounted = false
            subscription.remove()
        }
    }, [onLoginWithToken, t])

    const handleVerifyCode = async (): Promise<void> => {
        setOtpFieldErrorText(null)
        setGlobalErrorText(null)

        if (!otpCode.trim()) {
            setOtpFieldErrorText(t("pleaseEnterCode"))
            return
        }

        const result = await onLoginWithToken(otpCode.trim())
        if (!result.success) {
            setGlobalErrorText(result.message ?? t("couldNotFetchData"))
        }
    }

    const handleSendOtp = async (): Promise<void> => {
        setOtpFieldErrorText(null)
        setGlobalErrorText(null)

        try {
            const success = await requestAccessToken(email)
            if (success) {
                Alert.alert(t("status"), t("newCodeSent"))
            }
        } catch (error) {
            setGlobalErrorText(extractFriendlyErrorMessage(error) || t("couldNotSendCode"))
        }
    }

    const handleUseClipboardLink = async (): Promise<void> => {
        setOtpFieldErrorText(null)
        setGlobalErrorText(null)

        const clipboardText = await Clipboard.getStringAsync()
        const accessToken = extractAccessTokenFromManualInput(clipboardText)

        if (!accessToken) {
            setGlobalErrorText(t("expoGoClipboardNoToken"))
            return
        }

        const result = await onLoginWithToken(accessToken)
        if (!result.success) {
            setGlobalErrorText(result.message ?? t("invalidAccessToken"))
        }
    }

    return (
        <ScrollView
            className="w-full"
            contentContainerClassName="w-full flex-grow items-center justify-center px-4 py-4"
            keyboardShouldPersistTaps="handled"
        >
            <Card className="w-[92%] max-w-xl gap-4 rounded-2xl border-white/35 bg-black/55 px-5 py-7">
                <Text className="text-center font-inter-medium text-2xl leading-8 text-primary-foreground">
                    {t("verifyEmail")}
                </Text>

                <View className="mx-5 my-1 border-b-2 border-white/70" />

                <Text className="text-center font-inter text-base leading-6 text-primary-foreground">
                    {t("enterCodeFromEmail")}
                </Text>

                {isExpoGo ? (
                    <Text className="mt-2.5 text-center font-inter text-[13px] text-white/80">
                        {t("expoGoHint")}
                    </Text>
                ) : null}

                <View className="mt-4 gap-4">
                    <View>
                        <Input
                            autoCapitalize="none"
                            autoComplete={otpAutoComplete}
                            autoCorrect={false}
                            blurOnSubmit
                            className="font-inter"
                            onSubmitEditing={() => void handleVerifyCode()}
                            placeholder={t("codeFromEmail")}
                            returnKeyType="done"
                            textContentType="oneTimeCode"
                            value={otpCode}
                            onChangeText={setOtpCode}
                        />

                        {otpFieldErrorText ? (
                            <Text className="mt-1.5 font-inter text-[13px] text-destructive">
                                {otpFieldErrorText}
                            </Text>
                        ) : null}
                    </View>

                    {globalErrorText ? (
                        <Text className="font-inter text-[13px] text-destructive">
                            {globalErrorText}
                        </Text>
                    ) : null}

                    <View className="gap-3">
                        <Button className="h-12 rounded-xl" onPress={() => void handleVerifyCode()}>
                            <Text className="font-inter-semibold text-base leading-5">
                                {t("confirm")}
                            </Text>
                        </Button>

                        <Button
                            className="h-12 rounded-xl"
                            variant="outline"
                            onPress={() => void handleSendOtp()}
                        >
                            <Text className="font-inter-semibold text-base leading-5 text-foreground">
                                {t("sendNewCode")}
                            </Text>
                        </Button>

                        {isExpoGo ? (
                            <Button
                                className="h-12 rounded-xl"
                                variant="outline"
                                onPress={() => void handleUseClipboardLink()}
                            >
                                <Text className="font-inter-semibold text-base leading-5 text-foreground">
                                    {t("useLinkFromClipboard")}
                                </Text>
                            </Button>
                        ) : null}

                        <Button className="h-12 rounded-xl" variant="outline" onPress={onBack}>
                            <Text className="font-inter-semibold text-base leading-5 text-foreground">
                                {t("back")}
                            </Text>
                        </Button>
                    </View>
                </View>
            </Card>
        </ScrollView>
    )
}
