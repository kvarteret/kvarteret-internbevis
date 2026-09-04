jest.mock("@/core/storage/asyncStorage", () => ({
    getStoredJson: jest.fn(),
    setStoredJson: jest.fn(),
}))

import { getStoredJson } from "@/core/storage/asyncStorage"
import {
    fetchEventById,
    fetchEventOccurrences,
    fetchHomeEvents,
} from "@/features/dashboard/data/eventsRepository"
import type { EventOccurrence } from "@/features/dashboard/domain/types"

const createOccurrence = (id = "occurrence:event-1:date-1"): EventOccurrence => ({
    id,
    schedule: {
        kind: "timed",
        startsAt: "2026-09-04T18:30:00.000Z",
        endsAt: "2026-09-04T21:00:00.000Z",
        timeZone: "Europe/Oslo",
    },
    event: {
        id: "event-1",
        slug: "concert",
        kind: "single",
        status: "scheduled",
        updatedAt: "2026-09-03T13:35:22Z",
        title: "Concert",
        description: { html: "<p>Description</p>", text: "Description" },
        image: null,
        eventType: { id: "concert", name: "Konsert" },
        taxonomyGroup: { id: "eventTaxonomyGroup-musikk", name: "Konserter" },
        organizer: null,
        location: { kind: "venue", name: "Det Akademiske Kvarter" },
        pricing: {
            currency: "NOK",
            isFree: true,
            ordinary: null,
            student: null,
            member: null,
        },
        parent: null,
        links: {
            website: "https://www.samfunnetibergen.no/nb/arrangementer/concert",
            ticket: null,
            facebook: null,
        },
    },
})

const createApiResponse = (occurrences: EventOccurrence[]) => ({
    data: occurrences,
    meta: { locale: "nb" as const, from: "2026-09-04", to: null },
})

describe("eventsRepository (Samfunnet public API)", () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        global.fetch = jest.fn() as typeof fetch
        ;(getStoredJson as jest.Mock).mockResolvedValue(null)
        jest.clearAllMocks()
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    test("requests the generated events endpoint with locale and inclusive dates", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(
            new Response(JSON.stringify(createApiResponse([createOccurrence()])), {
                status: 200,
                headers: { "content-type": "application/json", etag: '"events-v1"' },
            }),
        )

        const response = await fetchEventOccurrences({
            language: "no",
            from: "2026-09-04",
            to: "2026-10-31",
        })

        const request = (global.fetch as jest.Mock).mock.calls[0][0] as Request
        const url = new URL(request.url)
        expect(url.origin).toBe("https://www.samfunnetibergen.no")
        expect(url.pathname).toBe("/api/v1/events")
        expect(url.searchParams.get("locale")).toBe("nb")
        expect(url.searchParams.get("from")).toBe("2026-09-04")
        expect(url.searchParams.get("to")).toBe("2026-10-31")
        expect(response.data[0]?.id).toBe("occurrence:event-1:date-1")
    })

    test("maps the app's English language to the API locale", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(
            new Response(
                JSON.stringify({
                    ...createApiResponse([createOccurrence()]),
                    meta: { locale: "en", from: "2026-09-04", to: null },
                }),
                { status: 200, headers: { "content-type": "application/json" } },
            ),
        )

        await fetchEventOccurrences({ language: "en", from: "2026-09-04" })
        const request = (global.fetch as jest.Mock).mock.calls[0][0] as Request
        expect(new URL(request.url).searchParams.get("locale")).toBe("en")
    })

    test("reuses an ETag snapshot when the API returns 304", async () => {
        const cached = createApiResponse([createOccurrence("cached-occurrence")])
        ;(getStoredJson as jest.Mock).mockResolvedValue({
            cachedAt: Date.now() - 60_000,
            etag: '"events-v1"',
            value: cached,
        })
        ;(global.fetch as jest.Mock).mockResolvedValue(new Response(null, { status: 304 }))

        const response = await fetchEventOccurrences({ language: "no", from: "2026-09-04" })
        const request = (global.fetch as jest.Mock).mock.calls[0][0] as Request
        expect(request.headers.get("if-none-match")).toBe('"events-v1"')
        expect(response.data[0]?.id).toBe("cached-occurrence")
    })

    test("returns a fresh cached snapshot on network failure", async () => {
        const cached = createApiResponse([createOccurrence("cached-occurrence")])
        ;(getStoredJson as jest.Mock).mockResolvedValue({
            cachedAt: Date.now() - 60_000,
            value: cached,
        })
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

        const events = await fetchHomeEvents("no")
        expect(events[0]?.id).toBe("cached-occurrence")
    })

    test("finds details by opaque occurrence id", async () => {
        const expected = createOccurrence("opaque-occurrence-id")
        ;(global.fetch as jest.Mock).mockResolvedValue(
            new Response(JSON.stringify(createApiResponse([expected])), {
                status: 200,
                headers: { "content-type": "application/json" },
            }),
        )

        const occurrence = await fetchEventById("opaque-occurrence-id", "no")
        expect(occurrence.event.title).toBe("Concert")
    })

    test("throws when an occurrence is absent and no cache exists", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(
            new Response(JSON.stringify(createApiResponse([])), {
                status: 200,
                headers: { "content-type": "application/json" },
            }),
        )

        await expect(fetchEventById("missing", "no")).rejects.toThrow("Event occurrence not found")
    })
})
