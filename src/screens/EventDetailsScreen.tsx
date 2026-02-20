import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import React, { useCallback, useLayoutEffect } from "react"
import { useTranslation } from "react-i18next"
import { Image, Linking, ScrollView, Text, useWindowDimensions, View } from "react-native"
import RenderHTML from "react-native-render-html"
import { SafeAreaView } from "react-native-safe-area-context"
import { AppButton } from "../components/common/AppButton"
import { RootStackParamList } from "../navigation/types"
import { fetchEventById, selectEventTranslation } from "../services/eventsService"
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
                <View className="rounded-card border border-border bg-surface p-4">
                    <Text className="mb-3 font-inter text-base text-text-primary">
                        {t("eventDetailsError")}
                    </Text>
                    <AppButton
                        secondary
                        text={t("eventDetailsRetry")}
                        onPress={() => {
                            void refetch()
                        }}
                    />
                </View>
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
    const detailsHtml = [descriptionHtml, contentHtml].filter(Boolean).join("<br/>")

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            <ScrollView className="flex-1" contentContainerClassName="gap-3 p-4">
                {event.image?.url ? (
                    <Image className="h-56 w-full rounded-card" source={{ uri: event.image.url }} />
                ) : null}

                <View className="rounded-card border border-border bg-surface p-4">
                    <Text className="font-inter-bold text-2xl text-text-primary">
                        {translation.value.title}
                    </Text>

                    <Text className="mt-2 font-inter-medium text-sm text-text-secondary">
                        {t("eventDetailsWhen")}: {start} - {end}
                    </Text>

                    {event.organizer?.name ? (
                        <Text className="mt-1 font-inter text-sm text-text-secondary">
                            {t("eventDetailsOrganizer")}: {event.organizer.name}
                        </Text>
                    ) : null}

                    {categories.length > 0 ? (
                        <Text className="mt-1 font-inter text-sm text-text-secondary">
                            {t("eventDetailsCategories")}: {categories}
                        </Text>
                    ) : null}

                    {event.price ? (
                        <Text className="mt-1 font-inter text-sm text-text-secondary">
                            {t("eventDetailsPrice")}: {event.price}
                        </Text>
                    ) : null}
                </View>

                <View className="rounded-card border border-border bg-surface p-4">
                    {detailsHtml ? (
                        <RenderHTML
                            contentWidth={width - 64}
                            source={{ html: detailsHtml }}
                            tagsStyles={{
                                body: {
                                    color: "#000000",
                                    fontSize: 14,
                                    lineHeight: 22,
                                },
                                p: {
                                    marginTop: 0,
                                    marginBottom: 10,
                                },
                            }}
                        />
                    ) : (
                        <Text className="font-inter text-sm leading-6 text-text-primary">
                            {t("eventDetailsNoDescription")}
                        </Text>
                    )}
                </View>

                {event.ticket_url ? (
                    <AppButton
                        text={t("eventDetailsTickets")}
                        onPress={() => handleOpenLink(event.ticket_url)}
                    />
                ) : null}

                {event.facebook_url ? (
                    <AppButton
                        secondary
                        text={t("eventDetailsFacebook")}
                        onPress={() => handleOpenLink(event.facebook_url)}
                    />
                ) : null}
            </ScrollView>
        </SafeAreaView>
    )
}
