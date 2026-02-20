import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import React, { useCallback, useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { Image, Linking, ScrollView, Text, useWindowDimensions, View } from "react-native"
import RenderHTML from "react-native-render-html"
import { SafeAreaView } from "react-native-safe-area-context"
import { LabeledValueRow } from "../components/common/LabeledValueRow"
import { NativeSurface } from "../components/common/NativeSurface"
import { StateSurface } from "../components/common/StateSurface"
import { Button } from "../components/ui/button"
import { platformUi } from "../constants/platformUi"
import { RootStackParamList } from "../navigation/types"
import { fetchEventById, selectEventTranslation } from "../services/eventsService"
import { triggerSoftImpactHaptic } from "../utils/haptics"
import { toRenderableHtml } from "../utils/html"

function formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date)
}

export function EventDetailsScreen({
    navigation,
    route,
}: NativeStackScreenProps<RootStackParamList, "EventDetails">): React.JSX.Element {
    const { t } = useTranslation()
    const { width } = useWindowDimensions()
    const { eventId } = route.params

    const {
        data: event,
        isPending,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["event", eventId],
        queryFn: ({ signal }) => fetchEventById(eventId, signal),
        retry: 1,
    })

    const translation = event ? selectEventTranslation(event.translations) : null
    const title = translation?.value.title ?? t("eventDetailsTitle")

    useLayoutEffect(() => {
        navigation.setOptions({ title })
    }, [navigation, title])

    const handleOpenLink = useCallback((url: string | null | undefined): void => {
        if (!url) {
            return
        }

        void triggerSoftImpactHaptic()
        void Linking.openURL(url)
    }, [])

    if (isPending) {
        return (
            <SafeAreaView className="flex-1 bg-background p-4">
                <Text className="font-inter text-base text-text-primary">
                    {t("eventDetailsLoading")}
                </Text>
            </SafeAreaView>
        )
    }

    if (isError || !event || !translation) {
        return (
            <SafeAreaView className="flex-1 bg-background p-4">
                <StateSurface>
                    <Text className="mb-3 font-inter text-base text-text-primary">
                        {t("eventDetailsError")}
                    </Text>
                    <Button
                        accessibilityLabel={t("eventDetailsRetry")}
                        variant="secondary"
                        onPress={() => {
                            void triggerSoftImpactHaptic()
                            void refetch()
                        }}
                    >
                        <Text className="font-inter-semibold text-base leading-5 text-text-primary">
                            {t("eventDetailsRetry")}
                        </Text>
                    </Button>
                </StateSurface>
            </SafeAreaView>
        )
    }

    const start = formatDateTime(event.event_start.toDate())
    const end = formatDateTime(event.event_end.toDate())
    const categories = event.categories.map(category => category.name).join(", ")
    const descriptionHtml = translation.value.description
        ? toRenderableHtml(translation.value.description)
        : ""
    const contentHtml = translation.value.content ? toRenderableHtml(translation.value.content) : ""
    const detailsHtml = Array.from(new Set([descriptionHtml, contentHtml].filter(Boolean))).join("")

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            <ScrollView
                className="flex-1"
                contentContainerClassName="gap-3 p-4"
                contentInsetAdjustmentBehavior="automatic"
            >
                {event.image?.url ? (
                    <NativeSurface variant="elevated">
                        <Image
                            className="h-56 w-full rounded-card"
                            source={{ uri: event.image.url }}
                        />
                    </NativeSurface>
                ) : null}

                <NativeSurface className="p-4" variant="grouped">
                    <Text className="font-inter-bold text-2xl text-text-primary">
                        {translation.value.title}
                    </Text>

                    <LabeledValueRow
                        className="mt-2"
                        label={t("eventDetailsWhen")}
                        value={`${start} - ${end}`}
                    />

                    {event.organizer?.name ? (
                        <LabeledValueRow
                            label={t("eventDetailsOrganizer")}
                            value={event.organizer.name}
                        />
                    ) : null}

                    {categories.length > 0 ? (
                        <LabeledValueRow label={t("eventDetailsCategories")} value={categories} />
                    ) : null}

                    {event.price ? (
                        <LabeledValueRow label={t("eventDetailsPrice")} value={event.price} />
                    ) : null}
                </NativeSurface>

                <NativeSurface className="p-4" variant="grouped">
                    {detailsHtml ? (
                        <RenderHTML
                            contentWidth={width - 64}
                            defaultTextProps={{ selectable: true }}
                            enableCSSInlineProcessing
                            enableExperimentalMarginCollapsing
                            baseStyle={{ color: "#111827", fontSize: 16, lineHeight: 24 }}
                            source={{ html: detailsHtml }}
                            renderersProps={{
                                a: {
                                    onPress: (_event, href) => {
                                        if (!href) {
                                            return
                                        }

                                        void handleOpenLink(href)
                                    },
                                },
                            }}
                        />
                    ) : (
                        <Text className="font-inter text-sm leading-6 text-text-primary">
                            {t("eventDetailsNoDescription")}
                        </Text>
                    )}
                </NativeSurface>

                {event.ticket_url || event.facebook_url ? (
                    <NativeSurface className="gap-3 p-4" variant="grouped">
                        {event.ticket_url ? (
                            <Button
                                accessibilityLabel={t("eventDetailsTickets")}
                                className="border-0 bg-danger"
                                variant="destructive"
                                onPress={() => handleOpenLink(event.ticket_url)}
                            >
                                <Text className="font-inter-semibold text-base leading-5 text-surface">
                                    {t("eventDetailsTickets")}
                                </Text>
                            </Button>
                        ) : null}

                        {event.facebook_url ? (
                            <Button
                                accessibilityLabel={t("eventDetailsFacebook")}
                                variant="secondary"
                                onPress={() => handleOpenLink(event.facebook_url)}
                            >
                                <Text className="font-inter-semibold text-base leading-5 text-text-primary">
                                    {t("eventDetailsFacebook")}
                                </Text>
                            </Button>
                        ) : null}
                    </NativeSurface>
                ) : null}

                <View style={{ height: platformUi.sectionSpacing }} />
            </ScrollView>
        </SafeAreaView>
    )
}
