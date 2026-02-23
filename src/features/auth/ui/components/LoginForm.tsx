import React from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Pressable, ScrollView, TouchableOpacity, View } from "react-native"
import { IconTextField } from "@/features/auth/ui/components/IconTextField"
import { Button } from "@/shared/ui/Button"
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
}: LoginFormProps): React.JSX.Element => {
    const { t } = useTranslation()

    return (
        <ScrollView
            className="w-full"
            contentContainerClassName="w-full flex-grow items-center justify-center px-4 py-4"
            keyboardShouldPersistTaps="handled"
        >
            <View className="w-[92%] max-w-xl rounded-card border border-[#FFFFFF59] bg-[#0000008C] p-6 shadow-card">
                <Text className="text-center text-3xl leading-9 text-surface font-bold">
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
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        </View>
                    ) : (
                        <View className="gap-3">
                            <Button onPress={() => void onSubmitEmail()}>
                                <Text className="text-base leading-5 text-surface font-semibold">
                                    {t("login")}
                                </Text>
                            </Button>
                            <Button variant="secondary" onPress={onDemoLogin}>
                                <Text className="text-base leading-5 text-text-primary font-semibold">
                                    {t("tryDemo")}
                                </Text>
                            </Button>
                        </View>
                    )}

                    <View className="flex-row items-start">
                        <TouchableOpacity
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: privacyPolicyChecked }}
                            className="mt-1"
                            onPress={onTogglePrivacy}
                        >
                            <View
                                className={cn(
                                    "h-5 w-5 items-center justify-center rounded border border-[#FFFFFFB3] bg-transparent",
                                    privacyPolicyChecked && "border-text-primary bg-text-primary",
                                )}
                            >
                                {privacyPolicyChecked ? (
                                    <Text className="text-sm leading-3 text-surface font-bold">
                                        ✓
                                    </Text>
                                ) : null}
                            </View>
                        </TouchableOpacity>

                        <Pressable className="ml-3 flex-1" onPress={onPrivacyPress}>
                            <Text className="text-xs text-link underline">
                                {t("privacyPolicyConsent")}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}
