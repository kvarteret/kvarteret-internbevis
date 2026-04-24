import { KvarteretEventDocument } from "@/features/dashboard/domain/types"
import {
    pickHomeEvents,
    selectEventTranslation,
    splitHomeEventsByTaxonomy,
} from "../eventSelection"

function createEvent(
    id: string,
    options?: {
        start?: Date
        end?: Date
        norwegianTitle?: string | null
        englishTitle?: string | null
        eventTypeSlug?: string
        eventTypeName?: string
        taxonomyGroup?: string
    },
): KvarteretEventDocument {
    const start = options?.start ?? new Date("2026-02-20T12:00:00.000Z")
    const end = options?.end ?? new Date("2026-02-20T14:00:00.000Z")
    const norwegianTitle = options?.norwegianTitle
    const englishTitle = options?.englishTitle
    const eventTypeSlug = options?.eventTypeSlug
    const eventTypeName = options?.eventTypeName
    const title = norwegianTitle ?? englishTitle ?? `Norsk ${id}`

    return {
        id,
        slug: `event-${id}`,
        status: "published",
        starts_at: start.toISOString(),
        ends_at: end.toISOString(),
        created_at: start.toISOString(),
        updated_at: start.toISOString(),
        ticket_url: null,
        facebook_url: null,
        image_url: null,
        image_caption: null,
        event_type_id: eventTypeSlug ?? "sosialt",
        event_type: eventTypeSlug
            ? {
                  id: eventTypeSlug,
                  slug: eventTypeSlug,
                  name: eventTypeName ?? eventTypeSlug,
                  description: null,
                  sort_order: 0,
                  is_active: true,
                  taxonomy_group: options?.taxonomyGroup ?? "Sosialt",
              }
            : null,
        room_id: null,
        room_text: null,
        room: null,
        organizer_groups: [],
        is_internal: false,
        is_featured: false,
        recurring_interval_days: null,
        price: null,
        language: norwegianTitle === null ? "en" : "no",
        title,
        description: null,
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

    test("splitHomeEventsByTaxonomy groups by backend taxonomy order", () => {
        const internal = createEvent("internal", {
            eventTypeSlug: "internarrangement",
            eventTypeName: "Internarrangement",
            taxonomyGroup: "Organisasjon",
        })
        internal.is_internal = true

        const music = createEvent("music", {
            eventTypeSlug: "konsert",
            eventTypeName: "Konsert",
            taxonomyGroup: "Musikk",
        })
        const academic = createEvent("academic", {
            eventTypeSlug: "debatt",
            eventTypeName: "Debatt",
            taxonomyGroup: "Faglig",
        })
        const fallback = createEvent("fallback", {
            eventTypeSlug: "unknown",
            eventTypeName: "Unknown",
            taxonomyGroup: "Annet",
        })

        const result = splitHomeEventsByTaxonomy(
            [internal, academic, fallback, music],
            {
                event_type_groups: [
                    {
                        name: "Musikk",
                        event_types: [],
                    },
                    {
                        name: "Faglig",
                        event_types: [],
                    },
                    {
                        name: "Annet",
                        event_types: [],
                    },
                ],
                organizer_groups: [],
                rooms: [],
            },
            "en",
        )

        expect(result.internal.map(event => event.id)).toEqual(["internal"])
        expect(result.taxonomyGroups.map(group => group.title)).toEqual([
            "Music",
            "Talks and debates",
            "Other events",
        ])
        expect(result.taxonomyGroups.map(group => group.events.map(event => event.id))).toEqual([
            ["music"],
            ["academic"],
            ["fallback"],
        ])
    })
})
