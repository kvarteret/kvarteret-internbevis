import { useCallback, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { openExternalUrl } from "@/core/linking/linkClient"
import {
    fetchEventById,
    selectEventTranslation,
} from "@/features/dashboard/data/eventsRepository"
import {
    formatEventDateTime,
    getEventCategoriesText,
    selectPrimaryDetailsHtml,
} from "@/features/dashboard/domain/eventFormatting"
import { toRenderableHtml } from "@/shared/utils/html"
import { triggerSoftImpactHaptic } from "@/shared/utils/haptics"

export const useEventDetailsScreenVM = (eventId: string) => {
    const { t } = useTranslation()
    const { language } = useLanguage()

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
        if (!event || !translationSelection) {
            return null
        }

        const detailsHtml = toRenderableHtml(selectPrimaryDetailsHtml(translationSelection.value))
        const start = formatEventDateTime(event.event_start.toDate(), language)
        const end = formatEventDateTime(event.event_end.toDate(), language)
        const categories = getEventCategoriesText(event)

        return {
            event,
            detailsHtml,
            whenValue: `${start} - ${end}`,
            categories,
        }
    }, [event, language, translationSelection])

    const openLink = useCallback(async (url: string): Promise<void> => {
        if (!url) {
            return
        }

        await triggerSoftImpactHaptic()
        await openExternalUrl(url)
    }, [])

    const retry = useCallback(async (): Promise<void> => {
        await triggerSoftImpactHaptic()
        await refetch()
    }, [refetch])

    return {
        state: {
            isPending,
            isError,
            title,
            details,
            hasEvent: Boolean(event && translationSelection),
        },
        actions: {
            retry,
            openLink,
        },
    }
}
