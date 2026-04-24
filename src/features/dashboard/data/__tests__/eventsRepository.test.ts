jest.mock("@/core/storage/asyncStorage", () => ({
    getStoredJson: jest.fn(),
    setStoredJson: jest.fn(),
}))

jest.mock("@/core/storage/sessionStorage", () => ({
    SESSION_STORAGE_KEYS: {
        accessToken: "accessToken",
    },
    getSessionValue: jest.fn(),
}))

import { getSessionValue } from "@/core/storage/sessionStorage"
import { fetchEventById, fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"

const createJsonResponse = (status: number, body: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: {
        get: (name: string) => {
            if (name.toLowerCase() === "content-type") return "application/json"
            return null
        },
    },
    text: async () => JSON.stringify(body),
})

const createEvent = (id = "event-1") => ({
    id,
    slug: id,
    status: "published",
    starts_at: "2026-02-20T12:00:00.000Z",
    ends_at: "2026-02-20T14:00:00.000Z",
    created_at: "2026-02-01T12:00:00.000Z",
    updated_at: "2026-02-01T12:00:00.000Z",
    ticket_url: null,
    facebook_url: null,
    image_url: null,
    event_type_id: "konsert",
    event_type: {
        id: "konsert",
        slug: "konsert",
        name: "Konsert",
        description: null,
        sort_order: 1,
        is_active: true,
        taxonomy_group: "Musikk",
    },
    room_id: null,
    room_text: null,
    room: null,
    organizer_groups: [],
    is_internal: false,
    is_featured: false,
    recurring_interval_days: null,
    price: null,
    language: "en",
    title: "Concert",
    description: null,
    image_caption: null,
    translations: {
        no: null,
        en: {
            available: true,
            title: "Concert",
            description: null,
            image_caption: null,
        },
    },
})

describe("eventsRepository", () => {
    const originalFetch = global.fetch

    beforeEach(() => {
        global.fetch = jest.fn() as typeof fetch
        ;(getSessionValue as jest.Mock).mockResolvedValue(null)
        jest.clearAllMocks()
    })

    afterAll(() => {
        global.fetch = originalFetch
    })

    test("fetchHomeEvents sends localized public event requests without Supabase headers", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(
            createJsonResponse(200, { events: [createEvent()] }),
        )

        await fetchHomeEvents({ includeInternal: false, language: "en" })

        const request = (global.fetch as jest.Mock).mock.calls[0][0] as Request
        expect(request.url).toBe(
            "https://personal.kvarteret.no/api/v1/events?include_internal=false&limit=100",
        )
        expect(request.headers.get("accept-language")).toBe("en")
        expect(request.headers.get("authorization")).toBeNull()
        expect(request.headers.get("apikey")).toBeNull()
    })

    test("fetchHomeEvents sends mobile-card bearer token for internal reads", async () => {
        ;(getSessionValue as jest.Mock).mockResolvedValue("mobile-card-token")
        ;(global.fetch as jest.Mock).mockResolvedValue(
            createJsonResponse(200, { events: [createEvent()] }),
        )

        await fetchHomeEvents({ includeInternal: true, language: "no" })

        const request = (global.fetch as jest.Mock).mock.calls[0][0] as Request
        expect(request.url).toBe(
            "https://personal.kvarteret.no/api/v1/events?include_internal=true&limit=100",
        )
        expect(request.headers.get("accept-language")).toBe("no")
        expect(request.headers.get("authorization")).toBe("Bearer mobile-card-token")
    })

    test("fetchEventById uses API-shaped detail fields", async () => {
        ;(global.fetch as jest.Mock).mockResolvedValue(createJsonResponse(200, createEvent("abc")))

        const event = await fetchEventById("abc", { includeInternal: false, language: "en" })

        const request = (global.fetch as jest.Mock).mock.calls[0][0] as Request
        expect(request.url).toBe("https://personal.kvarteret.no/api/v1/events/abc")
        expect(event.starts_at).toBe("2026-02-20T12:00:00.000Z")
        expect(event.ends_at).toBe("2026-02-20T14:00:00.000Z")
        expect(event.image_url).toBeNull()
        expect("event_start" in event).toBe(false)
        expect("event_end" in event).toBe(false)
        expect("image" in event).toBe(false)
    })
})
