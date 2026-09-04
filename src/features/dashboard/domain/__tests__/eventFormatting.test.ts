import type { EventOccurrence } from "@/features/dashboard/domain/types"
import {
    formatEventStart,
    formatEventStartStopWithDuration,
    formatOccurrenceStart,
    getPriceText,
    selectPrimaryDetailsHtml,
    selectProjectedDescriptionPreview,
    toRenderableHtml,
} from "../eventFormatting"

const occurrence = (overrides?: Partial<EventOccurrence>): EventOccurrence => ({
    id: "occurrence:event-1:date-1",
    schedule: {
        kind: "timed",
        startsAt: "2026-03-10T18:00:00.000Z",
        endsAt: "2026-03-10T20:30:00.000Z",
        timeZone: "Europe/Oslo",
    },
    event: {
        id: "event-1",
        slug: "event-1",
        kind: "single",
        status: "scheduled",
        updatedAt: null,
        title: "Event",
        description: { html: "<p>Hello <strong>world</strong></p>", text: "Hello world" },
        image: null,
        eventType: null,
        taxonomyGroup: null,
        organizer: null,
        location: { kind: "venue", name: "Det Akademiske Kvarter" },
        pricing: {
            currency: "NOK",
            isFree: false,
            ordinary: 150,
            student: 100,
            member: null,
        },
        parent: null,
        links: { website: "https://example.test/event-1", ticket: null, facebook: null },
    },
    ...overrides,
})

describe("eventFormatting", () => {
    afterEach(() => jest.useRealTimers())

    test("uses the API's sanitized HTML and plain-text description", () => {
        const event = occurrence()
        expect(selectPrimaryDetailsHtml(event)).toBe("<p>Hello <strong>world</strong></p>")
        expect(selectProjectedDescriptionPreview(event)).toBe("Hello world")
    })

    test("truncates description previews to 200 characters", () => {
        const text = "a".repeat(240)
        const event = occurrence({
            event: {
                ...occurrence().event,
                description: { html: `<p>${text}</p>`, text },
            },
        })
        expect(selectProjectedDescriptionPreview(event)).toBe(`${"a".repeat(200)}...`)
    })

    test("passes renderable API HTML through unchanged", () => {
        expect(toRenderableHtml("<p>Already <strong>formatted</strong></p>")).toBe(
            "<p>Already <strong>formatted</strong></p>",
        )
    })

    test("formats date-only occurrences without inventing a time", () => {
        const value = formatOccurrenceStart(
            occurrence({
                schedule: { kind: "date", date: "2026-10-14", timeZone: "Europe/Oslo" },
            }),
            "no",
        )
        expect(value).toContain("14")
        expect(value).not.toMatch(/\d{2}:\d{2}/)
    })

    test("formatEventStart uses relative phrasing for same-week dates", () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 2, 2, 12, 0, 0))
        const value = formatEventStart(new Date(2026, 2, 5, 18, 0, 0), "no")
        expect(value).toContain(" - 18:00")
        expect(value).toContain("om")
    })

    test("formats Norwegian duration phrasing on a separate line", () => {
        jest.useFakeTimers().setSystemTime(new Date(2026, 2, 1, 12, 0, 0))
        const value = formatEventStartStopWithDuration(
            new Date(2026, 2, 10, 19, 0, 0),
            new Date(2026, 2, 10, 21, 30, 0),
            "no",
        )
        expect(value).toContain("varer i 2 timer 30 minutter")
    })

    test("formats the API price range", () => {
        expect(getPriceText(occurrence(), "Gratis")).toBe("100–150 kr")
    })
})
