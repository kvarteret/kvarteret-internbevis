import React from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"
import { IconTextField } from "@/features/auth/ui/components/IconTextField"
import { Button } from "@/shared/ui/Button"
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
            <View className="w-[92%] max-w-xl rounded-2xl border border-[#FFFFFF59] bg-[#0000008C] px-5 py-7">
                <Text className="text-center text-2xl leading-8 text-surface font-medium">
                    {t("verifyEmail")}
                </Text>

                <View className="mx-5 my-2.5 border-b-2 border-[#FFFFFFB3]" />

                <Text className="text-center text-base leading-6 text-surface">
                    {t("enterCodeFromEmail")}
                </Text>

                {isExpoGo ? (
                    <Text className="mt-2.5 text-center text-[13px] text-[#FFFFFFCC]">
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
                        <Text className="text-[13px] text-state-danger">{globalErrorText}</Text>
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
            </View>
        </ScrollView>
    )
}
