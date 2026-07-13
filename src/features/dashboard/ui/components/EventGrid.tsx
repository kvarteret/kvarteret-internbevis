import React, { useMemo, useRef } from "react"
import { useTranslation } from "react-i18next"
import { NativeTouchEvent, PanResponder, useWindowDimensions, View } from "react-native"
import { EventFeedEntry } from "@/features/dashboard/domain/types"
import { EventCard } from "@/features/dashboard/ui/components/EventCard"
import { Text } from "@/shared/ui/Text"

const GRID_CARD_GAP = 10

interface EventGridProps {
    entries: EventFeedEntry[]
    onEventPress: (eventId: string) => void
    columns: 1 | 2
    onPinchColumnsChange?: (columns: 1 | 2) => void
}

const getTouchDistance = (touches: NativeTouchEvent["touches"]): number | null => {
    const [firstTouch, secondTouch] = touches
    if (!firstTouch || !secondTouch) return null
    return Math.hypot(firstTouch.pageX - secondTouch.pageX, firstTouch.pageY - secondTouch.pageY)
}

export const EventGrid = ({
    entries,
    onEventPress,
    columns,
    onPinchColumnsChange,
}: EventGridProps): React.JSX.Element => {
    const { t } = useTranslation()
    const { width } = useWindowDimensions()
    const pinchDistanceRef = useRef<number | null>(null)
    const listCardWidth = columns === 2 ? (width - 32 - GRID_CARD_GAP) / 2 : width - 32

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onMoveShouldSetPanResponder: event => event.nativeEvent.touches.length === 2,
                onStartShouldSetPanResponder: event => event.nativeEvent.touches.length === 2,
                onPanResponderGrant: event => {
                    pinchDistanceRef.current = getTouchDistance(event.nativeEvent.touches)
                },
                onPanResponderMove: event => {
                    const initialDistance = pinchDistanceRef.current
                    const currentDistance = getTouchDistance(event.nativeEvent.touches)
                    if (!initialDistance || !currentDistance || !onPinchColumnsChange) return
                    const scale = currentDistance / initialDistance
                    if (scale < 0.86) onPinchColumnsChange(2)
                    else if (scale > 1.14) onPinchColumnsChange(1)
                },
                onPanResponderRelease: () => {
                    pinchDistanceRef.current = null
                },
                onPanResponderTerminate: () => {
                    pinchDistanceRef.current = null
                },
            }),
        [onPinchColumnsChange],
    )

    return (
        <View className="w-full gap-2.5">
            <View className="flex-row items-center justify-between px-1">
                <Text className="text-2xl leading-8 text-editorial-ink font-black">
                    {t("eventFeedRest")}
                </Text>
                <Text className="text-xs uppercase tracking-widest text-editorial-action font-extrabold">
                    {t("eventSectionCount", { count: entries.length })}
                </Text>
            </View>
            <View
                className={columns === 2 ? "flex-row flex-wrap gap-2.5" : "gap-3"}
                {...panResponder.panHandlers}
            >
                {entries.map(({ event, upcomingDates }) => (
                    <EventCard
                        accessibilityOpenHint=""
                        cardWidth={listCardWidth}
                        event={event}
                        key={event._id}
                        layout="grid"
                        upcomingDates={upcomingDates}
                        onPress={onEventPress}
                    />
                ))}
            </View>
        </View>
    )
}
