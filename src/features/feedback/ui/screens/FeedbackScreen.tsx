import { useMutation } from "@tanstack/react-query"
import React, { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, ScrollView, View } from "react-native"
import { useSession } from "@/app/providers/SessionProvider"
import { DashboardShellLayout } from "@/features/dashboard/ui/components/DashboardShellLayout"
import { submitFeedback } from "@/features/feedback/data/feedbackRepository"
import {
    buildFeedbackUserContext,
    FEEDBACK_PAGE,
    FeedbackValidationError,
    MAX_FEEDBACK_MESSAGE_LENGTH,
} from "@/features/feedback/domain/feedback"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { Text } from "@/shared/ui/Text"
import { TextField } from "@/shared/ui/TextField"

type FeedbackStatus = {
    kind: "error" | "success"
    message: string
} | null

const getFeedbackErrorMessage = (
    error: unknown,
    t: (key: string, options?: Record<string, unknown>) => string,
): string => {
    if (error instanceof FeedbackValidationError) {
        if (error.code === "MESSAGE_TOO_LONG") {
            return t("feedbackMessageTooLong", {
                max: MAX_FEEDBACK_MESSAGE_LENGTH,
            })
        }

        return t("feedbackMessageRequired")
    }

    return t("feedbackError")
}

export const FeedbackScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const { user } = useSession()
    const [message, setMessage] = useState("")
    const [status, setStatus] = useState<FeedbackStatus>(null)

    const mutation = useMutation({
        mutationFn: async (rawMessage: string) =>
            submitFeedback({
                message: rawMessage,
                page: FEEDBACK_PAGE,
                platform: Platform.OS,
                user: buildFeedbackUserContext(user),
            }),
        onSuccess: () => {
            setMessage("")
            setStatus({
                kind: "success",
                message: t("feedbackSuccess"),
            })
        },
        onError: error => {
            setStatus({
                kind: "error",
                message: getFeedbackErrorMessage(error, t),
            })
        },
    })

    const handleChangeText = (nextValue: string): void => {
        setMessage(nextValue)

        if (status) {
            setStatus(null)
        }
    }

    const handleSubmit = (): void => {
        setStatus(null)
        mutation.mutate(message)
    }

    return (
        <DashboardShellLayout>
            <ScrollView
                className="flex-1"
                contentContainerClassName="gap-4 px-4 pb-36 pt-4"
                contentInsetAdjustmentBehavior="automatic"
                keyboardShouldPersistTaps="handled"
            >
                <Card className="gap-3 px-4 py-4" effect="liquid" variant="grouped">
                    <Text className="text-2xl font-black text-editorial-ink">
                        {t("feedbackTitle")}
                    </Text>
                    <Text className="text-base leading-6 text-text-secondary">
                        {t("feedbackIntro")}
                    </Text>
                </Card>

                <Card className="gap-4 px-4 py-4" effect="liquid" variant="grouped">
                    <View className="gap-2">
                        <Text className="text-sm font-semibold text-editorial-ink">
                            {t("feedbackMessageLabel")}
                        </Text>
                        <TextField
                            autoCapitalize="sentences"
                            className="min-h-40"
                            multiline
                            numberOfLines={8}
                            returnKeyType="default"
                            testID="feedback-message-input"
                            textAlignVertical="top"
                            value={message}
                            onChangeText={handleChangeText}
                        />
                        <Text className="text-right text-sm text-text-secondary">
                            {t("feedbackCharacterCount", {
                                count: message.length,
                                max: MAX_FEEDBACK_MESSAGE_LENGTH,
                            })}
                        </Text>
                    </View>

                    {mutation.isPending ? (
                        <Text className="text-sm text-text-secondary">{t("feedbackSending")}</Text>
                    ) : null}

                    {status ? (
                        <Text
                            className={
                                status.kind === "success"
                                    ? "text-sm text-editorial-valid"
                                    : "text-sm text-state-danger"
                            }
                        >
                            {status.message}
                        </Text>
                    ) : null}

                    <Button
                        disabled={mutation.isPending}
                        testID="feedback-submit-button"
                        onPress={handleSubmit}
                    >
                        {mutation.isPending ? t("feedbackSending") : t("feedbackSend")}
                    </Button>
                </Card>

                <EtjenestenFooter />
            </ScrollView>
        </DashboardShellLayout>
    )
}
