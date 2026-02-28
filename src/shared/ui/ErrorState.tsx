import React from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"

interface ErrorStateProps {
    message: string
    onRetry?: () => void
    retryLabel?: string
}

export const ErrorState = ({
    message,
    onRetry,
    retryLabel,
}: ErrorStateProps): React.JSX.Element => {
    const { t } = useTranslation()

    return (
        <Card className="gap-3 p-4">
            <Text className="text-base">{message}</Text>
            {onRetry ? (
                <Button variant="secondary" onPress={onRetry}>
                    {retryLabel ?? t("retry")}
                </Button>
            ) : null}
        </Card>
    )
}
