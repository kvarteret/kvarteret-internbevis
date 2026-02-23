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
            className="overflow-hidden"
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
                        transform: [{ scale: pressed ? 0.992 : 1 }],
                    },
                ]}
            >
                {event.image?.url ? (
                    <Image className="h-40 w-full" source={{ uri: event.image.url }} />
                ) : (
                    <View className="h-40 w-full bg-[#FFFFFF80]" />
                )}

                <View className="gap-1 p-3.5">
                    <Text className="text-base text-text-primary font-semibold" numberOfLines={2}>
                        {translation.value.title}
                    </Text>
                    <Text className="mt-1 text-xs text-text-secondary" numberOfLines={1}>
                        {formattedDate}
                    </Text>
                    {descriptionPreview ? (
                        <Text className="mt-1.5 text-sm text-text-secondary" numberOfLines={3}>
                            {descriptionPreview}
                        </Text>
                    ) : null}
                </View>
            </Pressable>
        </Card>
    )
}
