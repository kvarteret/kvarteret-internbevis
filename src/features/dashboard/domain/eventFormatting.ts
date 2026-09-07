import { differenceInMinutes, formatDistanceToNowStrict, isSameWeek } from "date-fns"
import { enUS, nb } from "date-fns/locale"
import { occurrenceStartDate } from "@/features/dashboard/domain/eventSelection"
import type { EventOccurrence } from "@/features/dashboard/domain/types"

const DESCRIPTION_PREVIEW_MAX_CHARS = 200

const getEventStartDate = (occurrence: EventOccurrence): Date => occurrenceStartDate(occurrence)

const getEventEndDate = (occurrence: EventOccurrence): Date => {
    if (occurrence.schedule.kind === "date") return occurrenceStartDate(occurrence)
    if (occurrence.schedule.endsAt) return new Date(occurrence.schedule.endsAt)
    return new Date(occurrenceStartDate(occurrence).getTime() + 2 * 60 * 60 * 1000)
}

const resolveDateLocale = (language: "no" | "en") => (language === "en" ? enUS : nb)
const localeCode = (language: "no" | "en"): string => (language === "en" ? "en-GB" : "nb-NO")
const WEEK_IN_MINUTES = 7 * 24 * 60
const DAY_IN_MINUTES = 24 * 60
const HOUR_IN_MINUTES = 60

const formatEventWhen = (date: Date, language: "no" | "en", now: Date): string => {
    const locale = resolveDateLocale(language)
    const timeLabel = new Intl.DateTimeFormat(localeCode(language), {
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
        timeZone: "Europe/Oslo",
    }).format(date)
    if (isSameWeek(date, now, { locale })) {
        const relativeLabel = formatDistanceToNowStrict(date, { addSuffix: true, locale })
        return `${relativeLabel} - ${timeLabel}`
    }
    const dateLabel = new Intl.DateTimeFormat(localeCode(language), {
        day: "numeric",
        month: "long",
        timeZone: "Europe/Oslo",
    }).format(date)
    return `${dateLabel} - ${timeLabel}`
}

const toDurationPart = (
    value: number,
    language: "no" | "en",
    unit: "week" | "day" | "hour" | "minute",
): string | null => {
    if (value <= 0) return null
    const labels =
        language === "en"
            ? {
                  week: value === 1 ? "week" : "weeks",
                  day: value === 1 ? "day" : "days",
                  hour: value === 1 ? "hour" : "hours",
                  minute: value === 1 ? "minute" : "minutes",
              }
            : {
                  week: value === 1 ? "uke" : "uker",
                  day: value === 1 ? "dag" : "dager",
                  hour: value === 1 ? "time" : "timer",
                  minute: value === 1 ? "minutt" : "minutter",
              }
    return `${value} ${labels[unit]}`
}

const formatEventDuration = (startDate: Date, endDate: Date, language: "no" | "en"): string => {
    let remainingMinutes = Math.max(0, differenceInMinutes(endDate, startDate))
    const weeks = Math.floor(remainingMinutes / WEEK_IN_MINUTES)
    remainingMinutes -= weeks * WEEK_IN_MINUTES
    const days = Math.floor(remainingMinutes / DAY_IN_MINUTES)
    remainingMinutes -= days * DAY_IN_MINUTES
    const hours = Math.floor(remainingMinutes / HOUR_IN_MINUTES)
    remainingMinutes -= hours * HOUR_IN_MINUTES
    const durationParts = [
        toDurationPart(weeks, language, "week"),
        toDurationPart(days, language, "day"),
        toDurationPart(hours, language, "hour"),
        toDurationPart(remainingMinutes, language, "minute"),
    ].filter(Boolean)

    return durationParts.length > 0
        ? durationParts.slice(0, 2).join(" ")
        : language === "en"
          ? "0 minutes"
          : "0 minutter"
}

const formatEventStart = (date: Date, language: "no" | "en"): string =>
    formatEventWhen(date, language, new Date())

const formatEventStartStopWithDuration = (
    startDate: Date,
    endDate: Date,
    language: "no" | "en",
): string => {
    const whenLabel = formatEventWhen(startDate, language, new Date())
    const durationLabel = formatEventDuration(startDate, endDate, language)
    return `${whenLabel}\n${language === "en" ? "lasts" : "varer i"} ${durationLabel}`
}

export const formatOccurrenceStart = (
    occurrence: EventOccurrence,
    language: "no" | "en",
): string => {
    if (occurrence.schedule.kind === "timed") {
        return formatEventStart(new Date(occurrence.schedule.startsAt), language)
    }
    return new Intl.DateTimeFormat(localeCode(language), {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Europe/Oslo",
    }).format(occurrenceStartDate(occurrence))
}

export const formatOccurrenceStartStopWithDuration = (
    occurrence: EventOccurrence,
    language: "no" | "en",
): string => {
    if (occurrence.schedule.kind === "date") return formatOccurrenceStart(occurrence, language)
    return formatEventStartStopWithDuration(
        getEventStartDate(occurrence),
        getEventEndDate(occurrence),
        language,
    )
}

export const getEventTaxonomyText = ({ event }: EventOccurrence): string => {
    const eventTypeName = event.eventType?.name ?? ""
    const organizerName = event.organizer?.name ?? ""
    if (!eventTypeName) return organizerName
    if (!organizerName) return eventTypeName
    return `${eventTypeName} (${organizerName})`
}

export const getEventRoomText = ({ event }: EventOccurrence): string => event.location.name

export const getPriceText = ({ event }: EventOccurrence, freeLabel: string): string => {
    if (event.pricing.isFree) return freeLabel
    const prices = [event.pricing.ordinary, event.pricing.student, event.pricing.member].filter(
        (price): price is number => price !== null,
    )
    if (prices.length === 0) return ""
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? `${min} kr` : `${min}–${max} kr`
}

export const selectProjectedDescriptionPreview = (occurrence: EventOccurrence): string => {
    const text = occurrence.event.description.text
    if (text.length <= DESCRIPTION_PREVIEW_MAX_CHARS) return text
    return `${text.slice(0, DESCRIPTION_PREVIEW_MAX_CHARS).trimEnd()}...`
}
