import { format } from "date-fns"
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

export const formatEventDateTime = (date: Date, language: "no" | "en"): string =>
    format(date, "PPp", { locale: language === "en" ? enUS : nb })

export const formatEventStart = (date: Date): string =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date)

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
