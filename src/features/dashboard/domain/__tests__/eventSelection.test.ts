import { FirestoreEventDocument } from "@/features/dashboard/domain/types"
import { pickHomeEvents, selectEventTranslation } from "../eventSelection"

function createTimestamp(date: Date): FirestoreEventDocument["event_start"] {
    return {
        toDate: () => date,
        toMillis: () => date.getTime(),
    } as FirestoreEventDocument["event_start"]
}

function createEvent(
    id: string,
    options?: {
        start?: Date
        end?: Date
        norwegianTitle?: string | null
        englishTitle?: string | null
    },
): FirestoreEventDocument {
    const start = options?.start ?? new Date("2026-02-20T12:00:00.000Z")
    const end = options?.end ?? new Date("2026-02-20T14:00:00.000Z")
    const norwegianTitle = options?.norwegianTitle
    const englishTitle = options?.englishTitle

    return {
        id,
        slug: `event-${id}`,
        status: "published",
        event_start: createTimestamp(start),
        event_end: createTimestamp(end),
        created_at: createTimestamp(start),
        updated_at: createTimestamp(start),
        ticket_url: null,
        facebook_url: null,
        image: null,
        organizer: null,
        categories: [],
        price: null,
        translations: {
            no:
                norwegianTitle === null
                    ? null
                    : {
                          available: true,
                          title: norwegianTitle ?? `Norsk ${id}`,
                          description: null,
                          image_caption: null,
                      },
            en:
                englishTitle === null
                    ? null
                    : {
                          available: true,
                          title: englishTitle ?? `English ${id}`,
                          description: null,
                          image_caption: null,
                      },
        },
    }
}

describe("eventsService", () => {
    test("selectEventTranslation prefers norwegian, then english", () => {
        const preferredNo = selectEventTranslation(
            createEvent("1", {
                norwegianTitle: "Norsk tittel",
                englishTitle: "English title",
            }).translations,
        )

        expect(preferredNo?.language).toBe("no")
        expect(preferredNo?.value.title).toBe("Norsk tittel")

        const fallbackEn = selectEventTranslation(
            createEvent("2", {
                norwegianTitle: null,
                englishTitle: "English only",
            }).translations,
        )

        expect(fallbackEn?.language).toBe("en")
        expect(fallbackEn?.value.title).toBe("English only")
    })

    test("pickHomeEvents excludes ended events", () => {
        const now = new Date("2026-02-20T12:00:00.000Z")
        const ended = createEvent("ended", {
            start: new Date("2026-02-20T08:00:00.000Z"),
            end: new Date("2026-02-20T09:00:00.000Z"),
        })
        const active = createEvent("active", {
            start: new Date("2026-02-20T11:00:00.000Z"),
            end: new Date("2026-02-20T13:00:00.000Z"),
        })

        const result = pickHomeEvents([ended, active], { now })
        expect(result.map(event => event.id)).toEqual(["active"])
    })

    test("pickHomeEvents returns at most 5 upcoming events", () => {
        const base = new Date("2026-02-20T12:00:00.000Z")
        const events = Array.from({ length: 7 }, (_, index) =>
            createEvent(String(index + 1), {
                start: new Date(base.getTime() + index * 60 * 60 * 1000),
                end: new Date(base.getTime() + (index + 1) * 60 * 60 * 1000),
            }),
        )

        const result = pickHomeEvents(events, { now: base })
        expect(result).toHaveLength(5)
        expect(result.map(event => event.id)).toEqual(["1", "2", "3", "4", "5"])
    })
})
