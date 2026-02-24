import React from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"
import { AuthMethod } from "@/features/auth/vm/useLoginForm"
import { IconTextField } from "@/features/auth/ui/components/IconTextField"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"

interface VerifyCodeFormProps {
    authMethod: AuthMethod
    otpCode: string
    otpFieldErrorText: string | null
    globalErrorText: string | null
    isExpoGo: boolean
    onChangeOtpCode: (value: string) => void
    onVerifyCode: () => Promise<void>
    onSendOtp: () => Promise<void>
    onUseClipboardLink: () => Promise<void>
    onBack: () => void
    onUseEmailFallback?: () => void
}

export const VerifyCodeForm = ({
    authMethod,
    otpCode,
    otpFieldErrorText,
    globalErrorText,
    isExpoGo,
    onChangeOtpCode,
    onVerifyCode,
    onSendOtp,
    onUseClipboardLink,
    onBack,
    onUseEmailFallback,
}: VerifyCodeFormProps): React.JSX.Element => {
    const { t } = useTranslation()
    const isPhoneMethod = authMethod === "phone"

    return (
        <ScrollView
            className="w-full"
            contentContainerClassName="w-full flex-grow items-center justify-center px-4 py-4"
            keyboardShouldPersistTaps="handled"
        >
            <Card
                className="w-11/12 max-w-xl px-5 py-7"
                effect="liquid"
                variant="elevated"
            >
                <Text className="text-center text-2xl leading-8 text-text-primary font-medium">
                    {isPhoneMethod ? t("verifySms") : t("verifyEmail")}
                </Text>

                <View className="mx-5 my-2.5 border-b border-border-soft" />

                <Text className="text-center text-base leading-6 text-text-secondary">
                    {isPhoneMethod ? t("enterCodeFromSms") : t("enterCodeFromEmail")}
                </Text>

                {isExpoGo ? (
                    <Text className="mt-2.5 text-center text-sm text-text-secondary">
                        {t("expoGoHint")}
                    </Text>
                ) : null}

                <View className="mt-7 gap-4">
                    <IconTextField
                        errorText={otpFieldErrorText}
                        iconName="lock"
                        keyboardType={isPhoneMethod ? "number-pad" : "default"}
                        placeholder={isPhoneMethod ? t("codeFromSms") : t("codeFromEmail")}
                        value={otpCode}
                        onChangeText={onChangeOtpCode}
                    />

                    {globalErrorText ? (
                        <Text className="text-sm text-state-danger">{globalErrorText}</Text>
                    ) : null}

                    <View className="gap-3">
                        <Button onPress={() => void onVerifyCode()}>
                            <Text className="text-base leading-5 text-surface font-semibold">
                                {t("confirm")}
                            </Text>
                        </Button>
                        <Button variant="secondary" onPress={() => void onSendOtp()}>
                            <Text className="text-base leading-5 text-text-primary font-semibold">
                                {t("sendNewCode")}
                            </Text>
                        </Button>
                        {isPhoneMethod && onUseEmailFallback ? (
                            <Button variant="secondary" onPress={onUseEmailFallback}>
                                <Text className="text-base leading-5 text-text-primary font-semibold">
                                    {t("useEmailInstead")}
                                </Text>
                            </Button>
                        ) : null}
                        {isExpoGo ? (
                            <Button variant="secondary" onPress={() => void onUseClipboardLink()}>
                                <Text className="text-base leading-5 text-text-primary font-semibold">
                                    {t("useLinkFromClipboard")}
                                </Text>
                            </Button>
                        ) : null}
                        <Button variant="secondary" onPress={onBack}>
                            <Text className="text-base leading-5 text-text-primary font-semibold">
                                {t("back")}
                            </Text>
                        </Button>
                    </View>
                </View>
            </Card>
        </ScrollView>
    )
}
