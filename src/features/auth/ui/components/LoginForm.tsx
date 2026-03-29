import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Pressable, TouchableOpacity, View, ViewStyle } from "react-native"
import { IconTextField } from "@/features/auth/ui/components/IconTextField"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { Button } from "@/shared/ui/Button"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

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
    const colors = useThemeRuntimeColors()

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

                    <View className="border-2 border-editorial-ink bg-surface px-3 py-3">
                        <Text className="mb-2 text-xs uppercase tracking-wide text-text-secondary font-semibold">
                            {t("privacy")}
                        </Text>

                        <View className="min-h-11 flex-row items-center gap-3">
                            <TouchableOpacity
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: privacyPolicyChecked }}
                                className="-m-2 shrink-0 p-2"
                                hitSlop={10}
                                onPress={onTogglePrivacy}
                            >
                                <View
                                    className={cn(
                                        "h-7 w-7 items-center justify-center rounded border-2 border-border bg-transparent",
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
                                className="min-w-0 flex-1 flex-row items-center gap-2"
                                onPress={onPrivacyPress}
                            >
                                <Text className="flex-1 text-sm leading-5 text-link underline font-medium">
                                    {t("privacyPolicyConsent")}
                                </Text>
                                <MaterialIcons color={colors.link} name="open-in-new" size={18} />
                            </Pressable>
                        </View>
                    </View>

                    {sendingOtp ? (
                        <View className="my-1">
                            <ActivityIndicator color={colors.editorialInk} size="small" />
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
