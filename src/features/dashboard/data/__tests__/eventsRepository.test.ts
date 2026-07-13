jest.mock("@/core/storage/asyncStorage", () => ({
    getStoredJson: jest.fn(),
    removeStoredValue: jest.fn(),
    setStoredJson: jest.fn(),
}))

import { getStoredJson, removeStoredValue, setStoredJson } from "@/core/storage/asyncStorage"
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

        const events = await fetchHomeEvents()

        const url = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string)
        expect(url.hostname).toContain("sanity.io")
        expect(url.searchParams.has("$today")).toBe(true)
        expect(url.searchParams.has("$includeInternal")).toBe(false)
        expect(url.searchParams.get("query")).toContain(
            "coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true",
        )
        expect(url.searchParams.get("query")).toContain(
            "dates[startDate >= $today] | order(startDate asc, startTime asc)",
        )
        expect(events).toHaveLength(1)
        expect(events[0]?._id).toBe("event-1")
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

        const events = await fetchHomeEvents()

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

        const events = await fetchHomeEvents()

        expect(events[0]?._id).toBe("cached-event")
    })

    test("fetchHomeEvents writes only the public offline cache", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(
            createSanityResponse([createSanityEvent("public-event")]),
        )

        await fetchHomeEvents()

        expect(setStoredJson).toHaveBeenCalledWith(
            "events_sanity_cache:home:public",
            expect.objectContaining({ value: [expect.objectContaining({ _id: "public-event" })] }),
        )
    })

    test("fetchEventById queries Sanity by document id", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(
            createSanityResponse(createSanityEvent("abc-123")),
        )

        const event = await fetchEventById("abc-123")

        const url = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string)
        expect(url.hostname).toContain("sanity.io")
        expect(url.searchParams.get("$id")).toBe('"abc-123"')
        expect(url.searchParams.has("$includeInternal")).toBe(false)
        expect(url.searchParams.has("$today")).toBe(true)
        expect(url.searchParams.get("query")).toContain(
            "coalesce(isInternalEvent, parentEvent->isInternalEvent, false) != true",
        )
        expect(url.searchParams.get("query")).toContain('eventStatus in ["cancelled", "postponed"]')
        expect(url.searchParams.get("query")).toContain(
            "dates[] | order(startDate asc, startTime asc)",
        )
        expect(event._id).toBe("abc-123")
        expect(event.dates[0]?.startDate).toBe("2026-05-20")
    })

    test("fetchEventById tombstones an event that becomes unavailable", async () => {
        let cachedValue: unknown = {
            cachedAt: Date.now(),
            value: createSanityEvent("removed-event"),
        }
        ;(getStoredJson as jest.Mock).mockImplementation(async () => cachedValue)
        ;(removeStoredValue as jest.Mock).mockImplementation(async () => {
            cachedValue = null
        })
        ;(global.fetch as jest.Mock)
            .mockResolvedValueOnce(createSanityResponse(null))
            .mockRejectedValueOnce(new Error("Network error"))

        await expect(fetchEventById("removed-event")).rejects.toThrow("Event not found")
        expect(removeStoredValue).toHaveBeenCalledWith(
            "events_sanity_cache:event:removed-event:public",
        )
        await expect(fetchEventById("removed-event")).rejects.toThrow("Network error")
    })

    test("fetchEventById returns a cached event on a transport failure", async () => {
        ;(getStoredJson as jest.Mock).mockResolvedValue({
            cachedAt: Date.now(),
            value: createSanityEvent("cached-event"),
        })
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

        await expect(fetchEventById("cached-event")).resolves.toEqual(
            expect.objectContaining({ _id: "cached-event" }),
        )
    })
})
