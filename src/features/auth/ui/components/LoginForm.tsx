import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { useTranslation } from "react-i18next"
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native"
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
        <ScrollView
            className="w-full"
            contentContainerClassName="w-full flex-grow items-center justify-center px-4 py-4"
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
        >
            <View
                className="w-11/12 max-w-xl border-2 border-editorial-ink bg-surface px-6 py-6"
                style={BRUTAL_PANEL_STYLE}
            >
                <Text className="text-center text-3xl leading-9 font-black uppercase tracking-tight">
                    {t("login")}
                </Text>

                <View className="mt-6 gap-6">
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
                        <View className="my-2">
                            <ActivityIndicator color={colors.editorialInk} size="small" />
                        </View>
                    ) : (
                        <View className="gap-3">
                            <Button
                                className="bg-editorial-ink"
                                style={BRUTAL_BUTTON_STYLE}
                                onPress={() => void onSubmitEmail()}
                            >
                                <Text className="text-base leading-5 text-surface font-semibold">
                                    {t("login")}
                                </Text>
                            </Button>
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
                    )}
                    <Button
                        accessibilityHint={t("continueAnonymouslyHint")}
                        className="bg-brand-primary"
                        style={BRUTAL_BUTTON_STYLE}
                        variant="secondary"
                        onPress={onContinueAnonymous}
                    >
                        <Text className="text-base leading-5 text-editorial-ink font-semibold">
                            {t("continueAnonymously")}
                        </Text>
                    </Button>

                    <View className="border-2 border-editorial-ink bg-surface px-3 py-3">
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
                                <MaterialIcons color={colors.link} name="open-in-new" size={16} />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </ScrollView>
    )
}
