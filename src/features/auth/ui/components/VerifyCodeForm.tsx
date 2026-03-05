import React from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View, ViewStyle } from "react-native"
import { IconTextField } from "@/features/auth/ui/components/IconTextField"
import { Button } from "@/shared/ui/Button"
import { Text } from "@/shared/ui/Text"

const BRUTAL_PANEL_STYLE: ViewStyle = {
    boxShadow: "8px 8px 0px #111827",
}

const BRUTAL_BUTTON_STYLE: ViewStyle = {
    borderWidth: 2,
    borderColor: "#111827",
    borderRadius: 0,
}

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
            scrollEnabled={false}
        >
            <View
                className="w-11/12 max-w-xl border-2 border-editorial-ink bg-surface px-5 py-7"
                style={BRUTAL_PANEL_STYLE}
            >
                <Text className="text-center text-2xl leading-8 font-black uppercase tracking-tight">
                    {t("verifyEmail")}
                </Text>

                <View className="mx-5 my-3 border-b-2 border-editorial-ink" />

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
                        autoCapitalize="none"
                        autoComplete="one-time-code"
                        containerClassName="border-2 border-editorial-ink bg-surface px-4"
                        errorText={otpFieldErrorText}
                        iconName="lock"
                        inputClassName="py-4 text-lg"
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder={t("codeFromEmail")}
                        textContentType="oneTimeCode"
                        value={otpCode}
                        onChangeText={onChangeOtpCode}
                    />

                    {globalErrorText ? (
                        <Text className="text-sm text-state-danger">{globalErrorText}</Text>
                    ) : null}

                    <View className="gap-3">
                        <Button
                            className="bg-editorial-ink"
                            style={BRUTAL_BUTTON_STYLE}
                            onPress={() => void onVerifyCode()}
                        >
                            <Text className="text-base leading-5 text-surface font-semibold">
                                {t("confirm")}
                            </Text>
                        </Button>
                        <Button
                            variant="secondary"
                            className="bg-background"
                            style={BRUTAL_BUTTON_STYLE}
                            onPress={() => void onSendOtp()}
                        >
                            <Text className="text-base leading-5 text-editorial-ink font-semibold">
                                {t("sendNewCode")}
                            </Text>
                        </Button>
                        {isExpoGo ? (
                            <Button
                                variant="secondary"
                                className="bg-background"
                                style={BRUTAL_BUTTON_STYLE}
                                onPress={() => void onUseClipboardLink()}
                            >
                                <Text className="text-base leading-5 text-editorial-ink font-semibold">
                                    {t("useLinkFromClipboard")}
                                </Text>
                            </Button>
                        ) : null}
                        <Button
                            variant="secondary"
                            className="bg-brand-primary"
                            style={BRUTAL_BUTTON_STYLE}
                            onPress={onBack}
                        >
                            <Text className="text-base leading-5 text-editorial-ink font-semibold">
                                {t("back")}
                            </Text>
                        </Button>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}
