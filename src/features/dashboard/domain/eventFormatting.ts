import { differenceInMinutes, format, formatDistanceToNowStrict, isSameWeek } from "date-fns"
import { enUS, nb } from "date-fns/locale"
import { RRule } from "rrule"
import type {
    KvarteretEventDocument,
    SanityPortableTextBlock,
    SanityPortableTextMarkDef,
} from "@/features/dashboard/domain/types"
import { toOsloDate } from "@/shared/time/osloTime"

const DESCRIPTION_PREVIEW_MAX_CHARS = 200

// ─── Date helpers ──────────────────────────────────────────────────────────

// Re-exported so existing call sites keep one import path for event dates.
export { toOsloDate }

export const getEventStartDate = (event: KvarteretEventDocument): Date => {
    const first = event.dates[0]
    if (!first) return new Date()
    return toOsloDate(first.startDate, first.startTime)
}

export const getEventEndDate = (event: KvarteretEventDocument): Date => {
    const first = event.dates[0]
    if (!first) return new Date()
    if (first.endTime) return toOsloDate(first.startDate, first.endTime)
    // Default: 2 hours after start
    const start = toOsloDate(first.startDate, first.startTime)
    return new Date(start.getTime() + 2 * 60 * 60 * 1000)
}

// ─── Rrule expansion ──────────────────────────────────────────────────────

export const expandRruleUpcomingDates = (
    anchorDateStr: string,
    anchorTime: string | null,
    rruleStr: string,
    maxCount = 14,
): Date[] => {
    // Mirrors the approach in samfunnetibergen/ArrangementCard.tsx.
    // Uses between(now, ceiling) so that past-anchored recurring events
    // (whose explicit dates[] entry has passed) still yield future occurrences.
    try {
        const rule = new RRule({
            ...RRule.parseString(rruleStr),
            dtstart: new Date(`${anchorDateStr}T12:00:00Z`),
        })
        const now = new Date()
        const ceiling = new Date(now.getFullYear() + 2, now.getMonth(), now.getDate())
        return rule
            .between(now, ceiling, true)
            .slice(0, maxCount)
            .map((d: Date) => toOsloDate(d.toISOString().slice(0, 10), anchorTime))
    } catch {
        return []
    }
}

// ─── Portable Text serialization ───────────────────────────────────────────

const escapeHtml = (text: string): string =>
    text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")

const serializeSpans = (
    children: SanityPortableTextBlock["children"],
    markDefs: SanityPortableTextMarkDef[],
): string => {
    const defsMap = new Map(markDefs.map(def => [def._key, def]))

    return children
        .map(span => {
            let text = escapeHtml(span.text)
            for (const mark of span.marks ?? []) {
                if (mark === "strong") {
                    text = `<strong>${text}</strong>`
                } else if (mark === "em") {
                    text = `<em>${text}</em>`
                } else if (mark === "code") {
                    text = `<code>${text}</code>`
                } else {
                    const def = defsMap.get(mark)
                    if (def?._type === "link" && def.href) {
                        text = `<a href="${escapeHtml(def.href)}">${text}</a>`
                    }
                }
            }
            return text
        })
        .join("")
}

const portableTextToHtml = (blocks: SanityPortableTextBlock[] | null | undefined): string => {
    if (!blocks || blocks.length === 0) return ""

    return blocks
        .filter(block => block._type === "block")
        .map(block => {
            const content = serializeSpans(block.children, block.markDefs)
            switch (block.style) {
                case "h1":
                    return `<h1>${content}</h1>`
                case "h2":
                    return `<h2>${content}</h2>`
                case "h3":
                    return `<h3>${content}</h3>`
                case "h4":
                    return `<h4>${content}</h4>`
                case "blockquote":
                    return `<blockquote>${content}</blockquote>`
                default:
                    return `<p>${content}</p>`
            }
        })
        .join("")
}

const portableTextToPlainText = (blocks: SanityPortableTextBlock[] | null | undefined): string => {
    if (!blocks || blocks.length === 0) return ""

    return blocks
        .filter(block => block._type === "block")
        .map(block => block.children.map(span => span.text).join(""))
        .filter(Boolean)
        .join("\n\n")
}

// ─── Formatting functions ──────────────────────────────────────────────────

const resolveDateLocale = (language: "no" | "en") => (language === "en" ? enUS : nb)
const WEEK_IN_MINUTES = 7 * 24 * 60
const DAY_IN_MINUTES = 24 * 60
const HOUR_IN_MINUTES = 60

const formatEventWhen = (date: Date, language: "no" | "en", now: Date): string => {
    const locale = resolveDateLocale(language)
    const timeLabel = format(date, "HH:mm", { locale })
    if (isSameWeek(date, now, { locale })) {
        const relativeLabel = formatDistanceToNowStrict(date, { addSuffix: true, locale })
        return `${relativeLabel} - ${timeLabel}`
    }
    const dateLabel = format(date, language === "en" ? "d MMMM" : "d. MMMM", { locale })
    return `${dateLabel} - ${timeLabel}`
}

const toDurationPart = (
    value: number,
    language: "no" | "en",
    unit: "week" | "day" | "hour" | "minute",
): string | null => {
    if (value <= 0) return null
    if (language === "en") {
        switch (unit) {
            case "week":
                return `${value} ${value === 1 ? "week" : "weeks"}`
            case "day":
                return `${value} ${value === 1 ? "day" : "days"}`
            case "hour":
                return `${value} ${value === 1 ? "hour" : "hours"}`
            case "minute":
                return `${value} ${value === 1 ? "minute" : "minutes"}`
        }
    }
    switch (unit) {
        case "week":
            return `${value} ${value === 1 ? "uke" : "uker"}`
        case "day":
            return `${value} ${value === 1 ? "dag" : "dager"}`
        case "hour":
            return `${value} ${value === 1 ? "time" : "timer"}`
        case "minute":
            return `${value} ${value === 1 ? "minutt" : "minutter"}`
    }
}

const formatEventDuration = (startDate: Date, endDate: Date, language: "no" | "en"): string => {
    let remainingMinutes = Math.max(0, differenceInMinutes(endDate, startDate))
    const weeks = Math.floor(remainingMinutes / WEEK_IN_MINUTES)
    remainingMinutes -= weeks * WEEK_IN_MINUTES
    const days = Math.floor(remainingMinutes / DAY_IN_MINUTES)
    remainingMinutes -= days * DAY_IN_MINUTES
    const hours = Math.floor(remainingMinutes / HOUR_IN_MINUTES)
    remainingMinutes -= hours * HOUR_IN_MINUTES
    const minutes = remainingMinutes

    const durationParts = [
        toDurationPart(weeks, language, "week"),
        toDurationPart(days, language, "day"),
        toDurationPart(hours, language, "hour"),
        toDurationPart(minutes, language, "minute"),
    ].filter(Boolean)

    if (durationParts.length === 0) {
        return language === "en" ? "0 minutes" : "0 minutter"
    }

    return durationParts.slice(0, 2).join(" ")
}

export const formatEventStart = (date: Date, language: "no" | "en"): string =>
    formatEventWhen(date, language, new Date())

export const formatEventStartStopWithDuration = (
    startDate: Date,
    endDate: Date,
    language: "no" | "en",
): string => {
    const whenLabel = formatEventWhen(startDate, language, new Date())
    const durationLabel = formatEventDuration(startDate, endDate, language)
    const durationSentence =
        language === "en" ? `lasts ${durationLabel}` : `varer i ${durationLabel}`
    return `${whenLabel}\n${durationSentence}`
}

export const getEventTaxonomyText = (event: KvarteretEventDocument): string => {
    const eventTypeName = event.eventType?.name ?? ""
    const organizerName = [event.organizerGroup?.name, event.organizerText]
        .filter(Boolean)
        .join(", ")

    if (!eventTypeName) return organizerName
    if (!organizerName) return eventTypeName
    return `${eventTypeName} (${organizerName})`
}

export const getEventRoomText = (event: KvarteretEventDocument): string =>
    event.room?.name ?? event.roomText ?? ""

export interface RecurringBadgeLabels {
    recurring: string
    daily: string
    weekly: string
    monthly: string
}

export const getRecurringBadgeText = (
    rrule: string | null,
    labels: RecurringBadgeLabels,
): string => {
    if (!rrule) return labels.recurring

    const freqMatch = rrule.match(/FREQ=(\w+)/)
    const freq = freqMatch?.[1]?.toUpperCase()

    if (freq === "DAILY") return labels.daily
    if (freq === "WEEKLY") return labels.weekly
    if (freq === "MONTHLY") return labels.monthly
    return labels.recurring
}

export const getPriceText = (event: KvarteretEventDocument, freeLabel: string): string => {
    if (event.isFree) return freeLabel
    const prices = [event.priceOrdinar, event.priceStudent, event.priceMedlem].filter(
        (p): p is number => p !== null && p !== undefined,
    )
    if (prices.length === 0) return ""
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    return min === max ? `${min} kr` : `${min}–${max} kr`
}

export const selectPrimaryDetailsHtml = (
    description: KvarteretEventDocument["description"],
): string => portableTextToHtml(description)

export const selectProjectedDescriptionPreview = (
    description: KvarteretEventDocument["description"],
): string => {
    const text = portableTextToPlainText(description)
    if (text.length <= DESCRIPTION_PREVIEW_MAX_CHARS) return text
    return `${text.slice(0, DESCRIPTION_PREVIEW_MAX_CHARS).trimEnd()}...`
}

export const toRenderableHtml = (html: string): string => html
