import type { SanityPortableTextBlock } from "@/features/dashboard/domain/types"
import {
    formatEventStart,
    formatEventStartStopWithDuration,
    getPriceText,
    getRecurringBadgeText,
    selectPrimaryDetailsHtml,
    selectProjectedDescriptionPreview,
    toRenderableHtml,
} from "../eventFormatting"

const block = (
    text: string,
    style: SanityPortableTextBlock["style"] = "normal",
    marks: string[] = [],
): SanityPortableTextBlock => ({
    _key: "k1",
    _type: "block",
    style,
    markDefs: [],
    children: [{ _key: "s1", _type: "span", text, marks }],
})

describe("eventFormatting", () => {
    afterEach(() => {
        jest.useRealTimers()
    })

    test("selectPrimaryDetailsHtml serializes blocks to html paragraphs", () => {
        const result = selectPrimaryDetailsHtml([block("Hello world")])
        expect(result).toBe("<p>Hello world</p>")
    })

    test("selectPrimaryDetailsHtml returns empty string for null", () => {
        expect(selectPrimaryDetailsHtml(null)).toBe("")
    })

    test("selectPrimaryDetailsHtml returns empty string for empty array", () => {
        expect(selectPrimaryDetailsHtml([])).toBe("")
    })

    test("selectPrimaryDetailsHtml applies heading styles", () => {
        expect(selectPrimaryDetailsHtml([block("Title", "h2")])).toBe("<h2>Title</h2>")
        expect(selectPrimaryDetailsHtml([block("Quote", "blockquote")])).toBe(
            "<blockquote>Quote</blockquote>",
        )
    })

    test("selectProjectedDescriptionPreview returns plain text from blocks", () => {
        expect(selectProjectedDescriptionPreview([block("Hello world")])).toBe("Hello world")
    })

    test("selectProjectedDescriptionPreview returns empty string for null", () => {
        expect(selectProjectedDescriptionPreview(null)).toBe("")
    })

    test("selectProjectedDescriptionPreview truncates to 200 chars", () => {
        const longText = "a".repeat(240)
        const result = selectProjectedDescriptionPreview([block(longText)])
        expect(result).toBe(`${"a".repeat(200)}...`)
    })

    test("toRenderableHtml passes html through unchanged", () => {
        const html = "<p>Already <strong>formatted</strong></p>"
        expect(toRenderableHtml(html)).toBe(html)
    })

    test("toRenderableHtml passes empty string through", () => {
        expect(toRenderableHtml("")).toBe("")
    })

    test("formatEventStart uses relative phrasing for same-week dates", () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 2, 2, 12, 0, 0))

        const value = formatEventStart(new Date(2026, 2, 5, 18, 0, 0), "no")

        expect(value).toContain(" - 18:00")
        expect(value).toContain("om")
    })

    test("formatEventStartStopWithDuration renders Norwegian duration phrasing on separate lines", () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 2, 1, 12, 0, 0))

        const start = new Date(2026, 2, 10, 19, 0, 0)
        const end = new Date(2026, 2, 10, 21, 30, 0)
        const value = formatEventStartStopWithDuration(start, end, "no")

        expect(value).toContain("varer i")
        expect(value).toContain("2 timer")
        expect(value).toContain("30 minutter")
    })

    test("getPriceText receives the translated free label from the UI boundary", () => {
        const event = { isFree: true } as Parameters<typeof getPriceText>[0]

        expect(getPriceText(event, "Free")).toBe("Free")
        expect(getPriceText(event, "Gratis")).toBe("Gratis")
    })

    test("getRecurringBadgeText receives translated labels instead of owning UI copy", () => {
        const labels = {
            recurring: "Recurring",
            daily: "every day",
            weekly: "every week",
            monthly: "every month",
        }

        expect(getRecurringBadgeText("FREQ=WEEKLY", labels)).toBe("every week")
        expect(getRecurringBadgeText(null, labels)).toBe("Recurring")
    })
})
