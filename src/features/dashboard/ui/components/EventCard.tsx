import type React from "react"
import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"
import { useLanguage } from "@/app/providers/LanguageProvider"
import {
    formatEventStart,
    getEventRoomText,
    getEventStartDate,
    getEventTaxonomyText,
    selectProjectedDescriptionPreview,
} from "@/features/dashboard/domain/eventFormatting"
import { buildUpcomingDateChips } from "@/features/dashboard/domain/eventSelection"
import type { KvarteretEventDocument } from "@/features/dashboard/domain/types"
import { CachedImage } from "@/shared/ui/CachedImage"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"
import { triggerSelectionHaptic } from "@/shared/utils/haptics"

export interface EventCardProps {
    event: KvarteretEventDocument
    cardWidth: number
    onPress: (eventId: string) => void
    accessibilityOpenHint: string
    layout?: "carousel" | "featured" | "grid"
    upcomingDates?: Date[]
}

export const EventCard = ({
    event,
    cardWidth,
    onPress,
    accessibilityOpenHint,
    layout = "carousel",
    upcomingDates,
}: EventCardProps): React.JSX.Element | null => {
    const { language } = useLanguage()
    const { t } = useTranslation()
    if (!event.title.trim()) return null

    const descriptionPreview = selectProjectedDescriptionPreview(event.description)
    const startDate = getEventStartDate(event)
    const formattedDate = formatEventStart(startDate, language)
    const taxonomyText = getEventTaxonomyText(event)
    const roomText = getEventRoomText(event)
    const statusLabel =
        event.eventStatus === "cancelled"
            ? t("eventStatusCancelled")
            : event.eventStatus === "postponed"
              ? t("eventStatusPostponed")
              : null
    const accessibilityLabel = `${event.title}. ${statusLabel ? `${statusLabel}. ` : ""}${formattedDate}.`
    const imageHeightClassName =
        layout === "featured" ? "h-80" : layout === "grid" ? "h-36" : "h-44"
    const contentClassName = layout === "grid" ? "gap-1.5 p-2.5" : "gap-1.5 p-4"
    const titleClassName =
        layout === "featured"
            ? "text-2xl leading-8 text-editorial-ink font-black"
            : layout === "grid"
              ? "text-base leading-5 text-editorial-ink font-extrabold"
              : "text-lg leading-6 text-editorial-ink font-extrabold"

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
                    onPress(event._id)
                }}
                style={({ pressed }) => [
                    {
                        opacity: pressed ? 0.92 : 1,
                        transform: [{ scale: pressed ? 0.994 : 1 }],
                    },
                ]}
            >
                <View>
                    {event.imageUrl ? (
                        <CachedImage
                            className={`${imageHeightClassName} w-full`}
                            contentFit="cover"
                            source={event.imageUrl}
                        />
                    ) : (
                        <View className={`${imageHeightClassName} w-full bg-surface-muted`} />
                    )}
                </View>

                <View className={contentClassName}>
                    {statusLabel ? (
                        <View className="self-start rounded-full bg-state-danger/15 px-2 py-1">
                            <Text className="text-xs uppercase tracking-wide text-state-danger font-extrabold">
                                {statusLabel}
                            </Text>
                        </View>
                    ) : null}
                    <Text
                        className="text-xs uppercase tracking-wide text-state-danger font-extrabold"
                        numberOfLines={1}
                    >
                        {formattedDate}
                    </Text>
                    {taxonomyText ? (
                        <Text
                            className="text-xs uppercase tracking-wide text-text-secondary font-semibold"
                            numberOfLines={1}
                        >
                            {taxonomyText}
                        </Text>
                    ) : null}
                    {roomText ? (
                        <Text
                            className="text-xs uppercase tracking-wide text-text-secondary font-semibold"
                            numberOfLines={1}
                        >
                            {roomText}
                        </Text>
                    ) : null}
                    <Text className={titleClassName} numberOfLines={2}>
                        {event.title}
                    </Text>
                    {upcomingDates && upcomingDates.length > 0 ? (
                        <View className="flex-row flex-wrap gap-1.5">
                            {buildUpcomingDateChips(upcomingDates).map(chip => (
                                <View
                                    key={chip}
                                    className="rounded-full border border-editorial-border bg-surface-muted px-2 py-0.5"
                                >
                                    <Text className="text-xs font-semibold text-text-secondary">
                                        {chip}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : null}
                    {descriptionPreview && layout !== "grid" ? (
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
