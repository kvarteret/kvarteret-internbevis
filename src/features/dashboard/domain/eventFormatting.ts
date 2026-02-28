import { differenceInMinutes, format, formatDistanceToNowStrict, isSameWeek } from "date-fns"
import { enUS, nb } from "date-fns/locale"
import { FirestoreEventDocument } from "@/features/dashboard/domain/types"

const DESCRIPTION_PREVIEW_MAX_CHARS = 200
const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i

const normalizeDescriptionInput = (value: string): string => {
    const trimmed = value.trim()
    if (trimmed.length < 2) {
        return trimmed
    }

    const hasWrappingDoubleQuotes = trimmed.startsWith('"') && trimmed.endsWith('"')
    const hasWrappingSingleQuotes = trimmed.startsWith("'") && trimmed.endsWith("'")
    if (!hasWrappingDoubleQuotes && !hasWrappingSingleQuotes) {
        return trimmed
    }

    try {
        const parsed = JSON.parse(trimmed)
        if (typeof parsed === "string") {
            return parsed.trim()
        }
    } catch {
        // Fall back to unwrapping simple quoted payloads.
    }

    return trimmed.slice(1, -1).trim()
}

const decodeHtmlEntities = (value: string): string =>
    value
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")

const stripHtml = (value: string): string => {
    const withoutTags = value.replace(/<[^>]+>/g, " ")
    const decoded = decodeHtmlEntities(withoutTags)
    return decoded.replace(/\s+/g, " ").trim()
}

const resolveDateLocale = (language: "no" | "en") => (language === "en" ? enUS : nb)
const WEEK_IN_MINUTES = 7 * 24 * 60
const DAY_IN_MINUTES = 24 * 60
const HOUR_IN_MINUTES = 60

const formatEventWhen = (date: Date, language: "no" | "en", now: Date): string => {
    const locale = resolveDateLocale(language)
    const timeLabel = format(date, "HH:mm", { locale })
    if (isSameWeek(date, now, { locale })) {
        const relativeLabel = formatDistanceToNowStrict(date, {
            addSuffix: true,
            locale,
        })
        return `${relativeLabel} - ${timeLabel}`
    }

    const dateLabel = format(date, language === "en" ? "d MMMM" : "d. MMMM", { locale })
    return `${dateLabel} - ${timeLabel}`
}

const toDurationPart = (value: number, language: "no" | "en", unit: "week" | "day" | "hour" | "minute"): string | null => {
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

export const formatEventDateTime = (date: Date, language: "no" | "en"): string =>
    format(date, "PPp", { locale: resolveDateLocale(language) })

export const formatEventStart = (date: Date, language: "no" | "en"): string =>
    formatEventWhen(date, language, new Date())

export const formatEventStartStopWithDuration = (
    startDate: Date,
    endDate: Date,
    language: "no" | "en",
): string => {
    const whenLabel = formatEventWhen(startDate, language, new Date())
    const durationLabel = formatEventDuration(startDate, endDate, language)
    return `${whenLabel}\n${durationLabel}`
}

export const getEventCategoriesText = (event: FirestoreEventDocument): string =>
    event.categories.map(category => category.name).join(", ")

export const selectPrimaryDetailsHtml = (
    translation:
        | FirestoreEventDocument["translations"]["no"]
        | FirestoreEventDocument["translations"]["en"],
): string => {
    return normalizeDescriptionInput(translation?.description ?? "")
}

export const toRenderableHtml = (value: string): string => {
    const trimmed = normalizeDescriptionInput(value)
    if (trimmed.length === 0) {
        return ""
    }

    if (HTML_TAG_PATTERN.test(trimmed)) {
        return trimmed
    }

    const normalized = trimmed.replace(/\r\n?/g, "\n")
    const paragraphs = normalized
        .split(/\n{2,}/)
        .map(part => part.trim())
        .filter(Boolean)

    return paragraphs
        .map(paragraph => {
            const escaped = paragraph
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/\"/g, "&quot;")
                .replace(/'/g, "&#39;")
                .replace(/\n/g, "<br/>")

            return `<p>${escaped}</p>`
        })
        .join("")
}

export const selectProjectedDescriptionPreview = (
    translation:
        | FirestoreEventDocument["translations"]["no"]
        | FirestoreEventDocument["translations"]["en"],
): string => {
    const descriptionSource = normalizeDescriptionInput(translation?.description ?? "")
    if (descriptionSource.length === 0) {
        return ""
    }

    const normalized = stripHtml(descriptionSource)
    if (normalized.length <= DESCRIPTION_PREVIEW_MAX_CHARS) {
        return normalized
    }

    return `${normalized.slice(0, DESCRIPTION_PREVIEW_MAX_CHARS).trimEnd()}...`
}
