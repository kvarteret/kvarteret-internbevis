import React from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, View, ViewStyle } from "react-native"
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

interface LoginFormProps {
    email: string
    emailErrorText: string | null
    sendingOtp: boolean
    onChangeEmail: (value: string) => void
    onSubmitEmail: () => Promise<void>
    onDemoLogin: () => void
    onContinueAnonymous: () => void
    showDemoButton: boolean
}

export const LoginForm = ({
    email,
    emailErrorText,
    sendingOtp,
    onChangeEmail,
    onSubmitEmail,
    onDemoLogin,
    onContinueAnonymous,
    showDemoButton,
}: LoginFormProps): React.JSX.Element => {
    const { t } = useTranslation()

    return (
        <View className="w-full items-center">
            <View
                className="w-full max-w-xl border-2 border-editorial-ink bg-surface px-5 py-6"
                style={BRUTAL_PANEL_STYLE}
            >
                <View className="gap-5">
                    <Button
                        accessibilityHint={t("continueAnonymouslyHint")}
                        className="bg-editorial-ink"
                        style={BRUTAL_BUTTON_STYLE}
                        onPress={onContinueAnonymous}
                    >
                        <Text className="text-base leading-5 text-surface font-semibold">
                            {t("continueAnonymously")}
                        </Text>
                    </Button>

                    <View className="flex-row items-center gap-3 py-1">
                        <View className="h-0.5 flex-1 bg-editorial-ink" />
                        <Text className="text-center text-sm uppercase tracking-wide text-editorial-ink font-black">
                            {t("guestLoginDivider")}
                        </Text>
                        <View className="h-0.5 flex-1 bg-editorial-ink" />
                    </View>

                    <IconTextField
                        autoCapitalize="none"
                        containerClassName="border-2 border-editorial-ink bg-surface px-4"
                        errorText={emailErrorText}
                        iconName="mail"
                        inputClassName="py-4 text-lg"
                        keyboardType="email-address"
                        placeholder={t("emailHint")}
                        value={email}
                        onChangeText={onChangeEmail}
                    />

                    {sendingOtp ? (
                        <View className="my-1">
                            <ActivityIndicator color="#111827" size="small" />
                        </View>
                    ) : (
                        <Button
                            className="bg-editorial-ink"
                            style={BRUTAL_BUTTON_STYLE}
                            onPress={() => void onSubmitEmail()}
                        >
                            <Text className="text-base leading-5 text-surface font-semibold">
                                {t("login")}
                            </Text>
                        </Button>
                    )}

                    {showDemoButton ? (
                        <Button
                            variant="secondary"
                            className="bg-background"
                            style={BRUTAL_BUTTON_STYLE}
                            onPress={onDemoLogin}
                        >
                            <Text className="text-base leading-5 text-editorial-ink font-semibold">
                                {t("tryDemo")}
                            </Text>
                        </Button>
                    ) : null}
                </View>
            </View>
        </View>
    )
}
