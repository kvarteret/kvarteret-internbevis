import { NativeStackScreenProps } from "@react-navigation/native-stack"
import React, { useLayoutEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Image, ScrollView, useWindowDimensions, View } from "react-native"
import RenderHTML from "react-native-render-html"
import { SafeAreaView } from "react-native-safe-area-context"
import { RootStackParamList } from "@/app/navigation/types"
import { LabeledValueRow } from "@/shared/ui/LabeledValueRow"
import { Button } from "@/shared/ui/Button"
import { Surface, StateSurface } from "@/shared/ui/Surface"
import { Text } from "@/shared/ui/Text"
import { useEventDetailsScreenVM } from "@/features/dashboard/vm/useEventDetailsScreenVM"

interface EventDetailsScreenProps extends NativeStackScreenProps<RootStackParamList, "EventDetails"> {}

const htmlBaseStyle = { color: "#111827", fontSize: 16, lineHeight: 24 }
const htmlDefaultTextProps = { selectable: true }

export const EventDetailsScreen = ({
    navigation,
    route,
}: EventDetailsScreenProps): React.JSX.Element => {
    const { t } = useTranslation()
    const { width } = useWindowDimensions()
    const { eventId } = route.params
    const { state, actions } = useEventDetailsScreenVM(eventId)
    const { openLink, retry } = actions

    useLayoutEffect(() => {
        navigation.setOptions({ title: state.title })
    }, [navigation, state.title])

    const renderersProps = useMemo(
        () => ({
            a: {
                onPress: (_event: unknown, href: string | undefined) => {
                    if (!href) {
                        return
                    }

                    void openLink(href)
                },
            },
        }),
        [openLink],
    )

    const htmlSource = useMemo(
        () => ({ html: state.details?.detailsHtml ?? "" }),
        [state.details?.detailsHtml],
    )

    if (state.isPending) {
        return (
            <SafeAreaView className="flex-1 bg-background p-4" edges={["left", "right", "bottom"]}>
                <Text className="text-base">{t("eventDetailsLoading")}</Text>
            </SafeAreaView>
        )
    }

    if (state.isError || !state.hasEvent || !state.details) {
        return (
            <SafeAreaView className="flex-1 bg-background p-4" edges={["left", "right", "bottom"]}>
                <StateSurface>
                    <Text className="mb-3 text-base">{t("eventDetailsError")}</Text>
                    <Button accessibilityLabel={t("eventDetailsRetry")} variant="secondary" onPress={retry}>
                        <Text className="text-base leading-5 text-text-primary font-semibold">
                            {t("eventDetailsRetry")}
                        </Text>
                    </Button>
                </StateSurface>
            </SafeAreaView>
        )
    }

    const { event } = state.details

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["left", "right", "bottom"]}>
            <ScrollView
                className="flex-1"
                contentContainerClassName="gap-3 p-4"
                contentInsetAdjustmentBehavior="automatic"
            >
                {event.image?.url ? (
                    <Surface variant="elevated">
                        <Image className="h-56 w-full rounded-card" source={{ uri: event.image.url }} />
                    </Surface>
                ) : null}

                <Surface className="p-4" effect="liquid" variant="grouped">
                    <LabeledValueRow label={t("eventDetailsWhen")} value={state.details.whenValue} />
                    {event.organizer?.name ? (
                        <LabeledValueRow label={t("eventDetailsOrganizer")} value={event.organizer.name} />
                    ) : null}
                    {state.details.categories.length > 0 ? (
                        <LabeledValueRow label={t("eventDetailsCategories")} value={state.details.categories} />
                    ) : null}
                    {event.price ? <LabeledValueRow label={t("eventDetailsPrice")} value={event.price} /> : null}
                </Surface>

                <Surface className="p-4" effect="liquid" variant="grouped">
                    {state.details.detailsHtml ? (
                        <RenderHTML
                            contentWidth={Math.max(width - 64, 0)}
                            defaultTextProps={htmlDefaultTextProps}
                            enableCSSInlineProcessing
                            enableExperimentalMarginCollapsing
                            baseStyle={htmlBaseStyle}
                            source={htmlSource}
                            renderersProps={renderersProps}
                        />
                    ) : (
                        <Text className="text-sm leading-6">{t("eventDetailsNoDescription")}</Text>
                    )}
                </Surface>

                <View className="gap-3">
                    {event.ticket_url?.trim() ? (
                        <Button
                            accessibilityLabel={t("eventDetailsTickets")}
                            className="border-0 bg-state-danger"
                            variant="destructive"
                            onPress={() => {
                                void openLink(event.ticket_url ?? "")
                            }}
                        >
                            <Text className="text-base leading-5 text-surface font-semibold">
                                {t("eventDetailsTickets")}
                            </Text>
                        </Button>
                    ) : null}

                    {event.facebook_url?.trim() ? (
                        <Button
                            accessibilityLabel={t("eventDetailsFacebook")}
                            variant="secondary"
                            onPress={() => {
                                void openLink(event.facebook_url ?? "")
                            }}
                        >
                            <Text className="text-base leading-5 text-text-primary font-semibold">
                                {t("eventDetailsFacebook")}
                            </Text>
                        </Button>
                    ) : null}
                </View>

                <View className="h-3" />
            </ScrollView>
        </SafeAreaView>
    )
}
