import {
    selectPrimaryDetailsHtml,
    selectProjectedDescriptionPreview,
    toRenderableHtml,
} from "../eventFormatting"

type Translation = {
    description: string | null
}

describe("eventFormatting", () => {
    test("selectPrimaryDetailsHtml uses description", () => {
        const translation: Translation = {
            description: "<p>Article body with <strong>rich text</strong></p>",
        }

        expect(selectPrimaryDetailsHtml(translation)).toBe(
            "<p>Article body with <strong>rich text</strong></p>",
        )
    })

    test("selectPrimaryDetailsHtml returns empty string when description is missing", () => {
        const translation: Translation = {
            description: null,
        }

        expect(selectPrimaryDetailsHtml(translation)).toBe("")
    })

    test("selectPrimaryDetailsHtml returns empty string when description is empty", () => {
        const translation: Translation = {
            description: "   ",
        }

        expect(selectPrimaryDetailsHtml(translation)).toBe("")
    })

    test("selectProjectedDescriptionPreview strips html from description", () => {
        const translation: Translation = {
            description: "<p><strong>Hello</strong> world</p>",
        }

        expect(selectProjectedDescriptionPreview(translation)).toBe("Hello world")
    })

    test("selectProjectedDescriptionPreview returns description when present", () => {
        const translation: Translation = {
            description: "Description fallback",
        }

        expect(selectProjectedDescriptionPreview(translation)).toBe("Description fallback")
    })

    test("selectProjectedDescriptionPreview truncates to 200 chars", () => {
        const translation: Translation = {
            description: `<p>${"a".repeat(240)}</p>`,
        }

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
        const translation: Translation = {
            description: '"<p><strong>Hello</strong> world</p>"',
        }

        expect(selectProjectedDescriptionPreview(translation)).toBe("Hello world")
    })
})
