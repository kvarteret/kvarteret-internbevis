import React from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"
import { IconTextField } from "@/features/auth/ui/components/IconTextField"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"

interface VerifyCodeFormProps {
    otpCode: string
    otpFieldErrorText: string | null
    globalErrorText: string | null
    isExpoGo: boolean
    onChangeOtpCode: (value: string) => void
    onVerifyCode: () => Promise<void>
    onSendOtp: () => Promise<void>
    onUseClipboardLink: () => Promise<void>
    onBack: () => void
}

export const VerifyCodeForm = ({
    otpCode,
    otpFieldErrorText,
    globalErrorText,
    isExpoGo,
    onChangeOtpCode,
    onVerifyCode,
    onSendOtp,
    onUseClipboardLink,
    onBack,
}: VerifyCodeFormProps): React.JSX.Element => {
    const { t } = useTranslation()

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
                    {t("verifyEmail")}
                </Text>

                <View className="mx-5 my-2.5 border-b border-border-soft" />

                <Text className="text-center text-base leading-6 text-text-secondary">
                    {t("enterCodeFromEmail")}
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
                        placeholder={t("codeFromEmail")}
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
