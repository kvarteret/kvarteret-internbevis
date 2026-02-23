import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Pressable, ScrollView, TouchableOpacity, View } from "react-native"
import { IconTextField } from "@/features/auth/ui/components/IconTextField"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

interface LoginFormProps {
    email: string
    emailErrorText: string | null
    privacyPolicyChecked: boolean
    sendingOtp: boolean
    onChangeEmail: (value: string) => void
    onTogglePrivacy: () => void
    onPrivacyPress: () => void
    onSubmitEmail: () => Promise<void>
    onDemoLogin: () => void
    onContinueAnonymous: () => void
    showDemoButton: boolean
}

export const LoginForm = ({
    email,
    emailErrorText,
    privacyPolicyChecked,
    sendingOtp,
    onChangeEmail,
    onTogglePrivacy,
    onPrivacyPress,
    onSubmitEmail,
    onDemoLogin,
    onContinueAnonymous,
    showDemoButton,
}: LoginFormProps): React.JSX.Element => {
    const { t } = useTranslation()

    return (
        <ScrollView
            className="w-full"
            contentContainerClassName="w-full flex-grow items-center justify-center px-4 py-4"
            keyboardShouldPersistTaps="handled"
        >
            <Card
                className="w-[92%] max-w-xl border border-border p-6"
                effect="liquid"
                variant="elevated"
            >
                <Text className="text-center text-3xl leading-9 text-text-primary font-bold">
                    {t("login")}
                </Text>

                <View className="mt-6 gap-6">
                    <IconTextField
                        autoCapitalize="none"
                        errorText={emailErrorText}
                        iconName="mail"
                        keyboardType="email-address"
                        placeholder={t("emailHint")}
                        value={email}
                        onChangeText={onChangeEmail}
                    />

                    {sendingOtp ? (
                        <View className="my-2">
                            <ActivityIndicator color="#111827" size="small" />
                        </View>
                    ) : (
                        <View className="gap-3">
                            <Button onPress={() => void onSubmitEmail()}>
                                <Text className="text-base leading-5 text-surface font-semibold">
                                    {t("login")}
                                </Text>
                            </Button>
                            {showDemoButton ? (
                                <Button variant="secondary" onPress={onDemoLogin}>
                                    <Text className="text-base leading-5 text-text-primary font-semibold">
                                        {t("tryDemo")}
                                    </Text>
                                </Button>
                            ) : null}
                        </View>
                    )}
                    <Button
                        accessibilityHint={t("continueAnonymouslyHint")}
                        variant="secondary"
                        onPress={onContinueAnonymous}
                    >
                        <Text className="text-base leading-5 text-text-primary font-semibold">
                            {t("continueAnonymously")}
                        </Text>
                    </Button>

                    <View className="rounded-xl border border-border bg-surface px-3 py-3">
                        <Text className="mb-2 text-xs uppercase tracking-wide text-text-secondary font-semibold">
                            {t("privacy")}
                        </Text>

                        <View className="flex-row items-start">
                            <TouchableOpacity
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: privacyPolicyChecked }}
                                className="mt-0.5"
                                onPress={onTogglePrivacy}
                            >
                                <View
                                    className={cn(
                                        "h-5 w-5 items-center justify-center rounded border border-border bg-transparent",
                                        privacyPolicyChecked &&
                                            "border-text-primary bg-text-primary",
                                    )}
                                >
                                    {privacyPolicyChecked ? (
                                        <Text className="text-sm leading-3 text-surface font-bold">
                                            ✓
                                        </Text>
                                    ) : null}
                                </View>
                            </TouchableOpacity>

                            <Pressable
                                accessibilityRole="button"
                                className="ml-3 flex-1 flex-row items-start gap-1"
                                onPress={onPrivacyPress}
                            >
                                <Text className="flex-1 text-sm leading-5 text-link underline font-medium">
                                    {t("privacyPolicyConsent")}
                                </Text>
                                <MaterialIcons color="#2563EB" name="open-in-new" size={16} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Card>
        </ScrollView>
    )
}
