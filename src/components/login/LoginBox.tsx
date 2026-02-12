import { MaterialIcons } from "@expo/vector-icons"
import React, { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from "react-native"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Text } from "@/components/ui/text"
import { extractFriendlyErrorMessage, requestAccessToken } from "../../services/authService"
import { consumePendingDeepLinkToken } from "../../services/pendingDeepLinkToken"

interface LoginBoxProps {
    onOtpRequested: (email: string) => void
    onDemoLogin: () => void
    onPrivacyPress: () => void
    onLoginWithToken: (
        email: string,
        accessToken: string,
    ) => Promise<{ success: boolean; message?: string }>
}

function isEmailInputValid(email: string): boolean {
    const normalized = email.trim()
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}

export function LoginBox({
    onOtpRequested,
    onDemoLogin,
    onPrivacyPress,
    onLoginWithToken,
}: LoginBoxProps): React.JSX.Element {
    const { t } = useTranslation()
    const [email, setEmail] = useState("")
    const [emailErrorText, setEmailErrorText] = useState<string | null>(null)
    const [sendingOtp, setSendingOtp] = useState(false)
    const [privacyPolicyChecked, setPrivacyPolicyChecked] = useState(false)

    const normalizedEmail = useMemo(() => email.trim(), [email])

    const sendOtp = async (): Promise<void> => {
        setEmailErrorText(null)

        if (!privacyPolicyChecked) {
            Alert.alert(t("privacyPolicyConsentAlertHeader"), t("privacyPolicyConsentAlert"))
            return
        }

        if (!isEmailInputValid(normalizedEmail)) {
            setEmailErrorText(t("invalidEmail"))
            return
        }

        setSendingOtp(true)

        try {
            const deepLinkToken = consumePendingDeepLinkToken()

            if (deepLinkToken) {
                const deepLinkLoginResult = await onLoginWithToken(normalizedEmail, deepLinkToken)
                if (deepLinkLoginResult.success) {
                    return
                }
            }

            await requestAccessToken(normalizedEmail)
            onOtpRequested(normalizedEmail)
        } catch (error) {
            setEmailErrorText(extractFriendlyErrorMessage(error))
        } finally {
            setSendingOtp(false)
        }
    }

    return (
        <ScrollView
            className="w-full"
            contentContainerClassName="w-full flex-grow items-center justify-center px-4 py-4"
            keyboardShouldPersistTaps="handled"
        >
            <Card className="w-[92%] max-w-xl gap-6 rounded-card border-white/35 bg-black/55 p-6 shadow-card">
                <Text className="text-center font-inter-bold text-3xl leading-9 text-primary-foreground">
                    {t("login")}
                </Text>

                <View className="gap-6">
                    <View>
                        <View className="min-h-14 flex-row items-center gap-2.5 rounded-xl border border-border bg-card px-3">
                            <MaterialIcons name="mail" size={20} color="#6b7280" />
                            <Input
                                autoComplete="email"
                                autoCapitalize="none"
                                autoCorrect={false}
                                blurOnSubmit
                                className="h-auto flex-1 border-0 bg-transparent px-0 py-3 font-inter text-base text-foreground shadow-none"
                                keyboardType="email-address"
                                onSubmitEditing={() => void sendOtp()}
                                placeholder={t("emailHint")}
                                placeholderTextColor="#6b7280"
                                returnKeyType="go"
                                textContentType="emailAddress"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        {emailErrorText ? (
                            <Text className="mt-1.5 font-inter text-xs text-destructive">
                                {emailErrorText}
                            </Text>
                        ) : null}
                    </View>

                    {sendingOtp ? (
                        <View className="my-2">
                            <ActivityIndicator color="#ffffff" size="small" />
                        </View>
                    ) : (
                        <View className="gap-3">
                            <Button className="h-12 rounded-xl" onPress={() => void sendOtp()}>
                                <Text className="font-inter-semibold text-base leading-5">
                                    {t("login")}
                                </Text>
                            </Button>
                            <Button
                                className="h-12 rounded-xl"
                                variant="outline"
                                onPress={onDemoLogin}
                            >
                                <Text className="font-inter-semibold text-base leading-5 text-foreground">
                                    {t("tryDemo")}
                                </Text>
                            </Button>
                        </View>
                    )}

                    <View className="flex-row items-start">
                        <Checkbox
                            checked={privacyPolicyChecked}
                            className="mt-1"
                            onCheckedChange={checked => {
                                setPrivacyPolicyChecked(Boolean(checked))
                            }}
                        />

                        <Pressable className="ml-3 flex-1" onPress={onPrivacyPress}>
                            <Text className="font-inter text-xs text-accent underline">
                                {t("privacyPolicyConsent")}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Card>
        </ScrollView>
    )
}
