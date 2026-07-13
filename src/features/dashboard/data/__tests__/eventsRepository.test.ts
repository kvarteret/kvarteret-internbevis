jest.mock("@/core/storage/asyncStorage", () => ({
    getStoredJson: jest.fn(),
    setStoredJson: jest.fn(),
}))

import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import { fetchEventById, fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"

const createSanityEvent = (id = "event-1") => ({
    _id: id,
    eventKind: "single",
    eventStatus: "scheduled",
    parent: null,
    title: "Concert",
    slug: id,
    dates: [{ _key: "d1", startDate: "2026-05-20", startTime: "19:00", endTime: "22:00" }],
    isRecurring: false,
    rrule: null,
    isFree: false,
    priceOrdinar: 100,
    priceStudent: 80,
    priceMedlem: null,
    ticketUrl: null,
    facebookUrl: null,
    imageUrl: null,
    imageCaption: null,
    room: null,
    roomText: null,
    organizerGroup: null,
    organizerText: null,
    eventType: null,
    description: null,
})

const createSanityResponse = (result: unknown) => ({
    ok: true,
    status: 200,
    json: async () => ({ result }),
})

describe("eventsRepository (Sanity)", () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        global.fetch = jest.fn() as typeof fetch
        ;(getStoredJson as jest.Mock).mockResolvedValue(null)
        jest.clearAllMocks()
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    test("fetchHomeEvents queries Sanity with today param", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(createSanityResponse([createSanityEvent()]))

        const events = await fetchHomeEvents({ includeInternal: false })

        const url = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string)
        expect(url.hostname).toContain("sanity.io")
        expect(url.searchParams.has("$today")).toBe(true)
        expect(url.searchParams.get("$includeInternal")).toBe("false")
        expect(url.searchParams.get("query")).toContain(
            "coalesce(isInternalEvent, parentEvent->isInternalEvent, false)",
        )
        expect(events).toHaveLength(1)
        expect(events[0]?._id).toBe("event-1")
    })

    test("fetchHomeEvents requests internal events for logged-in sessions", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(createSanityResponse([createSanityEvent()]))

        await fetchHomeEvents({ includeInternal: true })

        const url = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string)
        expect(url.searchParams.get("$includeInternal")).toBe("true")
    })

    test("fetchHomeEvents resolves fields inherited by materialized child events", async () => {
        const child = {
            ...createSanityEvent("child-event"),
            eventKind: "seriesInstance",
            title: null,
            imageUrl: null,
            isFree: null,
            parent: {
                _id: "parent-event",
                slug: "weekly-quiz",
                eventKind: "seriesParent",
                eventStatus: "scheduled",
                title: "Weekly quiz",
                description: null,
                imageUrl: "https://cdn.sanity.io/quiz.jpg",
                imageCaption: null,
                organizerGroup: null,
                organizerText: null,
                eventType: null,
                isFree: true,
                priceOrdinar: null,
                priceStudent: null,
                priceMedlem: null,
                ticketUrl: null,
                facebookUrl: null,
                isInternalEvent: false,
            },
        }
        ;(global.fetch as jest.Mock).mockResolvedValue(createSanityResponse([child]))

        const events = await fetchHomeEvents({ includeInternal: false })

        expect(events[0]).toEqual(
            expect.objectContaining({
                eventKind: "seriesInstance",
                title: "Weekly quiz",
                imageUrl: "https://cdn.sanity.io/quiz.jpg",
                isFree: true,
            }),
        )
        const url = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string)
        expect(url.searchParams.get("query")).toContain(
            'coalesce(eventKind, "single") in ["single", "seriesInstance", "festivalSession"]',
        )
    })

    test("fetchHomeEvents returns cached result on network failure", async () => {
        const cached = [createSanityEvent("cached-event")]
        ;(getStoredJson as jest.Mock).mockResolvedValue({
            cachedAt: Date.now() - 60_000,
            value: cached,
        })
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

        const events = await fetchHomeEvents({ includeInternal: false })

        expect(events[0]?._id).toBe("cached-event")
    })

    test("fetchHomeEvents keeps public and internal offline caches separate", async () => {
        ;(global.fetch as jest.Mock)
            .mockResolvedValueOnce(createSanityResponse([createSanityEvent("public-event")]))
            .mockResolvedValueOnce(createSanityResponse([createSanityEvent("internal-event")]))

        await fetchHomeEvents({ includeInternal: false })
        await fetchHomeEvents({ includeInternal: true })

        expect(setStoredJson).toHaveBeenNthCalledWith(
            1,
            "events_sanity_cache:home:public",
            expect.objectContaining({ value: [expect.objectContaining({ _id: "public-event" })] }),
        )
        expect(setStoredJson).toHaveBeenNthCalledWith(
            2,
            "events_sanity_cache:home:internal",
            expect.objectContaining({
                value: [expect.objectContaining({ _id: "internal-event" })],
            }),
        )
    })

    test("fetchHomeEvents cannot fall back to the internal cache for a public request", async () => {
        ;(getStoredJson as jest.Mock).mockImplementation(async (key: string) =>
            key.endsWith(":internal")
                ? { cachedAt: Date.now(), value: [createSanityEvent("internal-event")] }
                : null,
        )
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

        await expect(fetchHomeEvents({ includeInternal: false })).rejects.toThrow("Network error")
        await expect(fetchHomeEvents({ includeInternal: true })).resolves.toEqual([
            expect.objectContaining({ _id: "internal-event" }),
        ])
    })

    test("fetchEventById queries Sanity by document id", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(
            createSanityResponse(createSanityEvent("abc-123")),
        )

        const event = await fetchEventById("abc-123", { includeInternal: false })

        const url = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string)
        expect(url.hostname).toContain("sanity.io")
        expect(url.searchParams.get("$id")).toBe('"abc-123"')
        expect(url.searchParams.get("$includeInternal")).toBe("false")
        expect(url.searchParams.get("query")).toContain(
            "coalesce(isInternalEvent, parentEvent->isInternalEvent, false)",
        )
        expect(event._id).toBe("abc-123")
        expect(event.dates[0]?.startDate).toBe("2026-05-20")
    })

    test("fetchEventById throws when event is not found and no cache", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(createSanityResponse(null))

        await expect(fetchEventById("missing", { includeInternal: false })).rejects.toThrow(
            "Event not found",
        )
    })
})
