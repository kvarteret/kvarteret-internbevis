import { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useQuery } from "@tanstack/react-query"
import React, { useCallback, useLayoutEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Image, ScrollView, useWindowDimensions, View } from "react-native"
import RenderHTML from "react-native-render-html"
import { SafeAreaView } from "react-native-safe-area-context"
import { RootStackParamList } from "@/app/navigation/types"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { openExternalUrl } from "@/core/linking/linkClient"
import { fetchEventById, selectEventTranslation } from "@/features/dashboard/data/eventsRepository"
import {
    formatEventDateTime,
    getEventCategoriesText,
    selectPrimaryDetailsHtml,
    toRenderableHtml,
} from "@/features/dashboard/domain/eventFormatting"
import { Button } from "@/shared/ui/Button"
import { Card } from "@/shared/ui/Card"
import { LabeledValueRow } from "@/shared/ui/LabeledValueRow"
import { Text } from "@/shared/ui/Text"
import { triggerSoftImpactHaptic } from "@/shared/utils/haptics"

interface EventDetailsScreenProps
    extends NativeStackScreenProps<RootStackParamList, "EventDetails"> {}

export const EventDetailsScreen = ({
    navigation,
    route,
}: EventDetailsScreenProps): React.JSX.Element => {
    const { t } = useTranslation()
    const { language } = useLanguage()
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

    const translationSelection = event ? selectEventTranslation(event.translations) : null
    const title = translationSelection?.value.title ?? t("eventDetailsTitle")

    const details = useMemo(() => {
        if (!event || !translationSelection) return null
        const detailsHtml = toRenderableHtml(selectPrimaryDetailsHtml(translationSelection.value))
        const start = formatEventDateTime(event.event_start.toDate(), language)
        const end = formatEventDateTime(event.event_end.toDate(), language)
        const categories = getEventCategoriesText(event)
        return { event, detailsHtml, whenValue: `${start} - ${end}`, categories }
    }, [event, language, translationSelection])

    const openLink = useCallback(async (url: string): Promise<void> => {
        if (!url) return
        await triggerSoftImpactHaptic()
        await openExternalUrl(url)
    }, [])

    const retry = useCallback(async (): Promise<void> => {
        await triggerSoftImpactHaptic()
        await refetch()
    }, [refetch])

    useLayoutEffect(() => {
        navigation.setOptions({ title, headerLargeTitle: false })
    }, [navigation, title])

    const htmlSource = useMemo(
        () => ({ html: details?.detailsHtml ?? "" }),
        [details?.detailsHtml],
    )

    const htmlRenderersProps = useMemo(
        () => ({
            a: {
                onPress: (_event: unknown, href: string | undefined) => {
                    if (!href) return
                    void openLink(href)
                },
            },
        }),
        [openLink],
    )

    if (isPending) {
        return (
            <SafeAreaView className="flex-1 p-4" edges={["left", "right", "bottom"]}>
                <Text className="text-base">{t("eventDetailsLoading")}</Text>
            </SafeAreaView>
        )
    }

    if (isError || !event || !translationSelection || !details) {
        return (
            <SafeAreaView className="flex-1 p-4" edges={["left", "right", "bottom"]}>
                <Card className="gap-3 p-4">
                    <Text className="mb-3 text-base">{t("eventDetailsError")}</Text>
                    <Button
                        accessibilityLabel={t("eventDetailsRetry")}
                        variant="secondary"
                        onPress={retry}
                    >
                        <Text className="text-base leading-5 text-text-primary font-semibold">
                            {t("eventDetailsRetry")}
                        </Text>
                    </Button>
                </Card>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1" edges={["left", "right", "bottom"]}>
            <ScrollView
                className="flex-1"
                contentContainerClassName="gap-3 p-4"
                contentInsetAdjustmentBehavior="automatic"
            >
                {event.image?.url ? (
                    <Card variant="elevated">
                        <Image
                            className="h-56 w-full rounded-card"
                            source={{ uri: event.image.url }}
                        />
                    </Card>
                ) : null}

                <Card className="p-4" effect="liquid" variant="grouped">
                    <LabeledValueRow
                        label={t("eventDetailsWhen")}
                        value={details.whenValue}
                    />
                    {event.organizer?.name ? (
                        <LabeledValueRow
                            label={t("eventDetailsOrganizer")}
                            value={event.organizer.name}
                        />
                    ) : null}
                    {details.categories.length > 0 ? (
                        <LabeledValueRow
                            label={t("eventDetailsCategories")}
                            value={details.categories}
                        />
                    ) : null}
                    {event.price ? (
                        <LabeledValueRow label={t("eventDetailsPrice")} value={event.price} />
                    ) : null}
                </Card>

                <Card className="p-4" effect="liquid" variant="grouped">
                    {details.detailsHtml ? (
                        <RenderHTML
                            contentWidth={Math.max(width - 64, 0)}
                            renderersProps={htmlRenderersProps}
                            source={htmlSource}
                        />
                    ) : (
                        <Text className="text-sm leading-6">{t("eventDetailsNoDescription")}</Text>
                    )}
                </Card>

                <View className="gap-3">
                    {[
                        {
                            url: event.ticket_url,
                            label: t("eventDetailsTickets"),
                            variant: "destructive" as const,
                            textClass: "text-surface",
                        },
                        {
                            url: event.facebook_url,
                            label: t("eventDetailsFacebook"),
                            variant: "secondary" as const,
                            textClass: "text-text-primary",
                        },
                    ].map(({ url, label, variant, textClass }) =>
                        url?.trim() ? (
                            <Button
                                key={label}
                                accessibilityLabel={label}
                                variant={variant}
                                onPress={() => void openLink(url)}
                            >
                                <Text
                                    className={`text-base leading-5 font-semibold ${textClass}`}
                                >
                                    {label}
                                </Text>
                            </Button>
                        ) : null,
                    )}
                </View>

                <View className="h-3" />
            </ScrollView>
        </SafeAreaView>
    )
}
