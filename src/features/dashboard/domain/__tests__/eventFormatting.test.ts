import {
    formatEventStart,
    formatEventStartStopWithDuration,
    selectPrimaryDetailsHtml,
    selectProjectedDescriptionPreview,
    toRenderableHtml,
} from "../eventFormatting"
import type { FirestoreEventTranslation } from "../types"

const buildTranslation = (description: string | null): FirestoreEventTranslation => ({
    available: true,
    title: "Test event",
    description,
    image_caption: null,
})

describe("eventFormatting", () => {
    afterEach(() => {
        jest.useRealTimers()
    })

    test("selectPrimaryDetailsHtml uses description", () => {
        const translation = buildTranslation("<p>Article body with <strong>rich text</strong></p>")

        expect(selectPrimaryDetailsHtml(translation)).toBe(
            "<p>Article body with <strong>rich text</strong></p>",
        )
    })

    test("selectPrimaryDetailsHtml returns empty string when description is missing", () => {
        const translation = buildTranslation(null)

        expect(selectPrimaryDetailsHtml(translation)).toBe("")
    })

    test("selectPrimaryDetailsHtml returns empty string when description is empty", () => {
        const translation = buildTranslation("   ")

        expect(selectPrimaryDetailsHtml(translation)).toBe("")
    })

    test("selectProjectedDescriptionPreview strips html from description", () => {
        const translation = buildTranslation("<p><strong>Hello</strong> world</p>")

        expect(selectProjectedDescriptionPreview(translation)).toBe("Hello world")
    })

    test("selectProjectedDescriptionPreview returns description when present", () => {
        const translation = buildTranslation("Description fallback")

        expect(selectProjectedDescriptionPreview(translation)).toBe("Description fallback")
    })

    test("selectProjectedDescriptionPreview truncates to 200 chars", () => {
        const translation = buildTranslation(`<p>${"a".repeat(240)}</p>`)

        expect(selectProjectedDescriptionPreview(translation)).toBe(`${"a".repeat(200)}...`)
    })

    test("toRenderableHtml keeps existing html untouched", () => {
        const html = "<p>Already <strong>formatted</strong></p>"
        expect(toRenderableHtml(html)).toBe(html)
    })

    test("toRenderableHtml converts plain text paragraphs and line breaks", () => {
        const plainText = "First line\nSecond line\n\nThird line"
        expect(toRenderableHtml(plainText)).toBe(
            "<p>First line<br/>Second line</p><p>Third line</p>",
        )
    })

    test("toRenderableHtml unwraps quoted html payloads", () => {
        const quotedHtml = '"<p>Hello <strong>world</strong></p>"'
        expect(toRenderableHtml(quotedHtml)).toBe("<p>Hello <strong>world</strong></p>")
    })

    test("selectProjectedDescriptionPreview ignores wrapping quotes", () => {
        const translation = buildTranslation('"<p><strong>Hello</strong> world</p>"')

        expect(selectProjectedDescriptionPreview(translation)).toBe("Hello world")
    })

    test("formatEventStart uses relative phrasing for same-week dates", () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 2, 2, 12, 0, 0))

        const value = formatEventStart(new Date(2026, 2, 5, 18, 0, 0), "no")

        expect(value).toContain(" - 18:00")
        expect(value).toContain("om")
    })

    test("formatEventStartStopWithDuration renders Norwegian duration phrasing on separate lines", () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 2, 1, 12, 0, 0))

        const value = formatEventStartStopWithDuration(
            new Date(2026, 2, 5, 18, 0, 0),
            new Date(2026, 2, 5, 19, 0, 0),
            "no",
        )

        expect(value).toContain("\nvarer i 1 time")
    })

    test("formatEventStartStopWithDuration renders English duration phrasing on separate lines", () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 2, 1, 12, 0, 0))

        const value = formatEventStartStopWithDuration(
            new Date(2026, 2, 5, 18, 0, 0),
            new Date(2026, 2, 5, 19, 0, 0),
            "en",
        )

        expect(value).toContain("\nlasts 1 hour")
    })
})
