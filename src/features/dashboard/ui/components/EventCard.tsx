import React from "react"
import { Image, Pressable, View } from "react-native"
import {
    formatEventStart,
    selectProjectedDescriptionPreview,
} from "@/features/dashboard/domain/eventFormatting"
import { selectEventTranslation } from "@/features/dashboard/domain/eventSelection"
import { FirestoreEventDocument } from "@/features/dashboard/domain/types"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"
import { triggerSelectionHaptic } from "@/shared/utils/haptics"

export interface EventCardProps {
    event: FirestoreEventDocument
    cardWidth: number
    onPress: (eventId: string) => void
    accessibilityOpenHint: string
}

export const EventCard = ({
    event,
    cardWidth,
    onPress,
    accessibilityOpenHint,
}: EventCardProps): React.JSX.Element | null => {
    const translation = selectEventTranslation(event.translations)
    if (!translation) {
        return null
    }

    const descriptionPreview = selectProjectedDescriptionPreview(translation.value)
    const formattedDate = formatEventStart(event.event_start.toDate())
    const accessibilityLabel = `${translation.value.title}. ${formattedDate}.`

    return (
        <Card
            className="overflow-hidden border border-editorial-border bg-editorial-surface"
            effect="liquid"
            style={{ width: cardWidth }}
            variant="grouped"
        >
            <Pressable
                accessibilityHint={accessibilityOpenHint}
                accessibilityLabel={accessibilityLabel}
                accessibilityRole="button"
                android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                onPress={() => {
                    void triggerSelectionHaptic()
                    onPress(event.id)
                }}
                style={({ pressed }) => [
                    {
                        opacity: pressed ? 0.92 : 1,
                        transform: [{ scale: pressed ? 0.994 : 1 }],
                    },
                ]}
            >
                {event.image?.url ? (
                    <Image className="h-44 w-full" source={{ uri: event.image.url }} />
                ) : (
                    <View className="h-44 w-full bg-surface-muted" />
                )}

                <View className="gap-1.5 p-4">
                    <Text
                        className="text-xs uppercase tracking-wide text-text-secondary font-semibold"
                        numberOfLines={1}
                    >
                        {formattedDate}
                    </Text>
                    <Text
                        className="text-lg leading-6 text-editorial-ink font-extrabold"
                        numberOfLines={2}
                    >
                        {translation.value.title}
                    </Text>
                    {descriptionPreview ? (
                        <Text
                            className="text-sm leading-5 text-editorial-ink-soft"
                            numberOfLines={3}
                        >
                            {descriptionPreview}
                        </Text>
                    ) : null}
                </View>
            </Pressable>
        </Card>
    )
}
