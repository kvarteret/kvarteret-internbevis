import { useQuery } from "@tanstack/react-query"
import { useLocalSearchParams, useNavigation } from "expo-router"
import type React from "react"
import { useCallback, useLayoutEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, useWindowDimensions, View } from "react-native"
import RenderHTML from "react-native-render-html"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { openExternalUrl } from "@/core/linking/linkClient"
import { fetchEventById } from "@/features/dashboard/data/eventsRepository"
import {
    formatEventStartStopWithDuration,
    getEventEndDate,
    getEventRoomText,
    getEventStartDate,
    getEventTaxonomyText,
    getPriceText,
    getRecurringBadgeText,
    selectPrimaryDetailsHtml,
    toRenderableHtml,
} from "@/features/dashboard/domain/eventFormatting"
import { Button } from "@/shared/ui/Button"
import { CachedImage } from "@/shared/ui/CachedImage"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { LabeledValueRow } from "@/shared/ui/LabeledValueRow"
import { Text } from "@/shared/ui/Text"
import { triggerSoftImpactHaptic } from "@/shared/utils/haptics"

export const EventDetailsScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const { language } = useLanguage()
    const { width } = useWindowDimensions()
    const { eventId } = useLocalSearchParams<{ eventId?: string | string[] }>()
    const resolvedEventId = Array.isArray(eventId) ? eventId[0] : eventId

    const {
        data: event,
        isPending,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["event", resolvedEventId],
        queryFn: ({ signal }) => {
            if (!resolvedEventId) throw new Error("Missing event ID.")
            return fetchEventById(resolvedEventId, signal)
        },
        enabled: Boolean(resolvedEventId),
        retry: 1,
    })

    const title = event?.title || t("eventDetailsTitle")
    const statusLabel =
        event?.eventStatus === "cancelled"
            ? t("eventStatusCancelled")
            : event?.eventStatus === "postponed"
              ? t("eventStatusPostponed")
              : null

    const details = useMemo(() => {
        if (!event) return null
        const detailsHtml = toRenderableHtml(selectPrimaryDetailsHtml(event.description))
        const startDate = getEventStartDate(event)
        const endDate = getEventEndDate(event)
        const whenValue = formatEventStartStopWithDuration(startDate, endDate, language)
        const taxonomy = getEventTaxonomyText(event)
        const roomText = getEventRoomText(event)
        const recurring = event.isRecurring
            ? getRecurringBadgeText(event.rrule, {
                  recurring: t("eventRecurring"),
                  daily: t("eventRecurringDaily"),
                  weekly: t("eventRecurringWeekly"),
                  monthly: t("eventRecurringMonthly"),
              })
            : ""
        const priceText = getPriceText(event, t("eventPriceFree"))
        return { event, detailsHtml, whenValue, taxonomy, roomText, recurring, priceText }
    }, [event, language, t])

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
        navigation.setOptions({ title })
    }, [navigation, title])

    const htmlSource = useMemo(() => ({ html: details?.detailsHtml ?? "" }), [details?.detailsHtml])

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
            <View className="flex-1 bg-background">
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="flex-grow gap-4 p-4"
                    contentInsetAdjustmentBehavior="automatic"
                >
                    <Text className="text-base">{t("eventDetailsLoading")}</Text>
                    <View className="mt-auto">
                        <EtjenestenFooter />
                    </View>
                </ScrollView>
            </View>
        )
    }

    if (!resolvedEventId || isError || !event || !details) {
        return (
            <View className="flex-1 bg-background">
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="flex-grow gap-4 p-4"
                    contentInsetAdjustmentBehavior="automatic"
                >
                    <Card className="gap-3 p-4">
                        <Text className="mb-3 text-base">{t("eventDetailsError")}</Text>
                        <Button
                            accessibilityLabel={t("eventDetailsRetry")}
                            variant="secondary"
                            onPress={retry}
                        >
                            <Text className="text-base leading-5 font-semibold">
                                {t("eventDetailsRetry")}
                            </Text>
                        </Button>
                    </Card>
                    <View className="mt-auto">
                        <EtjenestenFooter />
                    </View>
                </ScrollView>
            </View>
        )
    }

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerClassName="gap-5 px-4 pb-8 pt-3"
                contentInsetAdjustmentBehavior="automatic"
            >
                <View className="gap-3">
                    {event.imageUrl ? (
                        <CachedImage
                            className="h-80 w-full rounded-none"
                            contentFit="cover"
                            source={event.imageUrl}
                        />
                    ) : null}
                    {event.imageCaption ? (
                        <Text className="text-xs leading-5 text-editorial-ink-soft">
                            {event.imageCaption}
                        </Text>
                    ) : null}
                </View>

                <View className="gap-2 border-b border-border-soft pb-5">
                    {statusLabel ? (
                        <View className="self-start rounded-full bg-state-danger/15 px-3 py-1.5">
                            <Text className="text-sm uppercase tracking-widest text-state-danger font-extrabold">
                                {statusLabel}
                            </Text>
                        </View>
                    ) : null}
                    {details.taxonomy ? (
                        <Text className="text-sm uppercase tracking-widest text-editorial-action font-extrabold">
                            {details.taxonomy}
                        </Text>
                    ) : null}
                    <Text className="text-5xl leading-tight text-editorial-ink font-black">
                        {event.title}
                    </Text>
                    {details.roomText ? (
                        <Text className="text-base uppercase tracking-widest text-editorial-action font-extrabold">
                            {details.roomText}
                        </Text>
                    ) : null}
                </View>

                <Card className="p-4" effect="liquid" variant="grouped">
                    <LabeledValueRow label={t("eventDetailsWhen")} value={details.whenValue} />
                    {details.taxonomy ? (
                        <LabeledValueRow
                            label={t("eventDetailsTaxonomy")}
                            value={details.taxonomy}
                        />
                    ) : null}
                    {details.roomText ? (
                        <LabeledValueRow label={t("eventDetailsRoom")} value={details.roomText} />
                    ) : null}
                    {details.recurring ? (
                        <LabeledValueRow
                            label={t("eventDetailsRecurring")}
                            value={details.recurring}
                        />
                    ) : null}
                    {details.priceText ? (
                        <LabeledValueRow label={t("eventDetailsPrice")} value={details.priceText} />
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
                            url: event.ticketUrl,
                            label: t("eventDetailsTickets"),
                            variant: "destructive" as const,
                        },
                        {
                            url: event.facebookUrl,
                            label: t("eventDetailsFacebook"),
                            variant: "secondary" as const,
                        },
                    ].map(({ url, label, variant }) =>
                        url?.trim() ? (
                            <Button
                                key={label}
                                accessibilityLabel={label}
                                variant={variant}
                                onPress={() => void openLink(url)}
                            >
                                {label}
                            </Button>
                        ) : null,
                    )}
                </View>

                <View className="h-3" />
                <EtjenestenFooter />
            </ScrollView>
        </View>
    )
}
