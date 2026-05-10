jest.mock("@/core/storage/asyncStorage", () => ({
    getStoredJson: jest.fn(),
    setStoredJson: jest.fn(),
}))

import { getStoredJson } from "@/core/storage/asyncStorage"
import { fetchEventById, fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"

const createSanityEvent = (id = "event-1") => ({
    _id: id,
    title: "Concert",
    slug: id,
    dates: [{ _key: "d1", startDate: "2026-05-20", startTime: "19:00", endTime: "22:00" }],
    isRecurring: null,
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
        ;(global.fetch as jest.Mock).mockResolvedValue(
            createSanityResponse([createSanityEvent()]),
        )

        const events = await fetchHomeEvents({ includeInternal: false, language: "no" })

        const url = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string)
        expect(url.hostname).toContain("sanity.io")
        expect(url.searchParams.has("$today")).toBe(true)
        expect(events).toHaveLength(1)
        expect(events[0]!._id).toBe("event-1")
    })

    test("fetchHomeEvents returns cached result on network failure", async () => {
        const cached = [createSanityEvent("cached-event")]
        ;(getStoredJson as jest.Mock).mockResolvedValue({
            cachedAt: Date.now() - 60_000,
            value: cached,
        })
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"))

        const events = await fetchHomeEvents({ includeInternal: false, language: "no" })

        expect(events[0]!._id).toBe("cached-event")
    })

    test("fetchEventById queries Sanity by document id", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(
            createSanityResponse(createSanityEvent("abc-123")),
        )

        const event = await fetchEventById("abc-123", { includeInternal: false, language: "no" })

        const url = new URL((global.fetch as jest.Mock).mock.calls[0][0] as string)
        expect(url.hostname).toContain("sanity.io")
        expect(url.searchParams.get("$id")).toBe('"abc-123"')
        expect(event._id).toBe("abc-123")
        expect(event.dates[0]!.startDate).toBe("2026-05-20")
    })

    test("fetchEventById throws when event is not found and no cache", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(createSanityResponse(null))

        await expect(
            fetchEventById("missing", { includeInternal: false, language: "no" }),
        ).rejects.toThrow("Event not found")
    })
})
