const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*>/i

const decodeHtmlEntities = (value: string): string =>
    value
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")

export const stripHtml = (value: string): string => {
    const withoutTags = value.replace(/<[^>]+>/g, " ")
    const decoded = decodeHtmlEntities(withoutTags)
    return decoded.replace(/\s+/g, " ").trim()
}

export const toRenderableHtml = (value: string): string => {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
        return ""
    }

    if (HTML_TAG_PATTERN.test(trimmed)) {
        return trimmed
    }

    const escaped = trimmed
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/\n/g, "<br/>")

    return `<p>${escaped}</p>`
}
