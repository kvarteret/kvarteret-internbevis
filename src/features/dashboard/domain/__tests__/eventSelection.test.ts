import type { EventOccurrence } from "@/features/dashboard/domain/types"
import {
    buildEventCalendarMonths,
    buildEventFeedSections,
    buildUpcomingDateChips,
    createEmptyEventFilterState,
    deriveTaxonomyFromEvents,
    filterEvents,
    occurrenceDateString,
    parsePersistedEventFilterState,
    pickHomeEvents,
} from "../eventSelection"

const makeOccurrence = (
    id: string,
    options?: {
        startsAt?: string
        date?: string
        eventId?: string
        title?: string
        kind?: EventOccurrence["event"]["kind"]
        parentId?: string
        eventTypeId?: string
        eventTypeName?: string
        taxonomyGroupId?: string
        taxonomyGroupName?: string
        organizerId?: string
    },
): EventOccurrence => {
    const eventId = options?.eventId ?? id
    return {
        id,
        schedule: options?.date
            ? { kind: "date", date: options.date, timeZone: "Europe/Oslo" }
            : {
                  kind: "timed",
                  startsAt: options?.startsAt ?? "2026-09-10T17:00:00.000Z",
                  endsAt: null,
                  timeZone: "Europe/Oslo",
              },
        event: {
            id: eventId,
            slug: eventId,
            kind: options?.kind ?? "single",
            status: "scheduled",
            updatedAt: null,
            title: options?.title ?? `Event ${id}`,
            description: { html: "", text: "" },
            image: null,
            eventType: options?.eventTypeId
                ? { id: options.eventTypeId, name: options.eventTypeName ?? options.eventTypeId }
                : null,
            taxonomyGroup: options?.taxonomyGroupId
                ? {
                      id: options.taxonomyGroupId,
                      name: options.taxonomyGroupName ?? options.taxonomyGroupId,
                  }
                : null,
            organizer: options?.organizerId
                ? {
                      kind: "group",
                      id: options.organizerId,
                      name: options.organizerId,
                      slug: options.organizerId,
                  }
                : null,
            location: { kind: "venue", name: "Det Akademiske Kvarter" },
            pricing: {
                currency: "NOK",
                isFree: true,
                ordinary: null,
                student: null,
                member: null,
            },
            parent: options?.parentId
                ? {
                      id: options.parentId,
                      slug: options.parentId,
                      kind: "seriesParent",
                      status: "scheduled",
                      title: "Series",
                      website: `https://example.test/${options.parentId}`,
                  }
                : null,
            links: {
                website: `https://example.test/${eventId}`,
                ticket: null,
                facebook: null,
            },
        },
    }
}

describe("eventSelection", () => {
    test("derives localized taxonomy and group organizers from occurrences", () => {
        const concert = makeOccurrence("concert", {
            eventTypeId: "concert",
            eventTypeName: "Konsert",
            taxonomyGroupId: "eventTaxonomyGroup-musikk",
            taxonomyGroupName: "Konserter",
            organizerId: "samklang",
        })
        const talk = makeOccurrence("talk", {
            eventTypeId: "talk",
            taxonomyGroupId: "eventTaxonomyGroup-faglig",
            taxonomyGroupName: "Faglig",
        })

        const taxonomy = deriveTaxonomyFromEvents([concert, concert, talk])
        expect(taxonomy.taxonomyGroups.map(group => group._id)).toEqual([
            "eventTaxonomyGroup-faglig",
            "eventTaxonomyGroup-musikk",
        ])
        expect(taxonomy.taxonomyGroups[1]?.eventTypes).toEqual([
            { _id: "concert", name: "Konsert", slug: "concert" },
        ])
        expect(taxonomy.organizerGroups).toEqual([{ _id: "samklang", name: "samklang" }])
    })

    test("filters occurrences by taxonomy, event type, and organizer ids", () => {
        const concert = makeOccurrence("concert", {
            eventTypeId: "concert",
            taxonomyGroupId: "music",
            organizerId: "samklang",
        })
        const talk = makeOccurrence("talk", {
            eventTypeId: "talk",
            taxonomyGroupId: "academic",
        })

        expect(
            filterEvents([concert, talk], {
                taxonomyGroup: "music",
                eventTypeIds: ["concert"],
                organizerGroupIds: ["samklang"],
            }).map(item => item.id),
        ).toEqual(["concert"])
    })

    test("parses persisted filters and removes duplicate ids", () => {
        expect(
            parsePersistedEventFilterState({
                eventTypeIds: ["concert", "concert"],
                organizerGroupIds: ["samklang"],
                taxonomyGroup: "music",
            }),
        ).toEqual({
            eventTypeIds: ["concert"],
            organizerGroupIds: ["samklang"],
            taxonomyGroup: "music",
        })
        expect(parsePersistedEventFilterState({ eventTypeIds: ["concert"] })).toBeNull()
    })

    test("builds one list card with future chips per series", () => {
        const first = makeOccurrence("quiz-1", {
            eventId: "quiz-instance-1",
            kind: "seriesInstance",
            parentId: "quiz-series",
            startsAt: "2026-09-08T17:00:00.000Z",
        })
        const second = makeOccurrence("quiz-2", {
            eventId: "quiz-instance-2",
            kind: "seriesInstance",
            parentId: "quiz-series",
            startsAt: "2026-09-15T17:00:00.000Z",
        })
        const concert = makeOccurrence("concert")

        const result = buildEventFeedSections([first, second, concert])
        expect(result.rest.map(entry => entry.occurrence.id)).toEqual(["quiz-1", "concert"])
        expect(result.rest[0]?.upcomingOccurrences).toEqual([second])
    })

    test("groups repeated dates of the same single event in the list projection", () => {
        const first = makeOccurrence("multi-1", { eventId: "multi" })
        const second = makeOccurrence("multi-2", {
            eventId: "multi",
            startsAt: "2026-09-11T17:00:00.000Z",
        })
        expect(buildEventFeedSections([first, second]).rest).toHaveLength(1)
    })

    test("formats two upcoming chips and an overflow count", () => {
        const occurrences = [5, 12, 19, 26].map(day =>
            makeOccurrence(`event-${day}`, {
                startsAt: `2026-05-${String(day).padStart(2, "0")}T18:00:00.000Z`,
            }),
        )
        expect(buildUpcomingDateChips(occurrences)).toEqual([
            expect.stringMatching(/5/),
            expect.stringMatching(/12/),
            "+2",
        ])
    })

    test("builds a calendar projection retaining every occurrence and empty months", () => {
        const september = makeOccurrence("september", { date: "2026-09-08" })
        const november = makeOccurrence("november", { date: "2026-11-03" })
        const months = buildEventCalendarMonths([september, november], "2026-09-04")

        expect(months.map(month => month.key)).toEqual(["2026-08", "2026-09", "2026-10", "2026-11"])
        expect(months.map(month => month.eventCount)).toEqual([0, 1, 0, 1])
    })

    test("derives the local Oslo date from UTC timestamps", () => {
        expect(
            occurrenceDateString(
                makeOccurrence("midnight", { startsAt: "2026-09-04T22:30:00.000Z" }),
            ),
        ).toBe("2026-09-05")
    })

    test("picks future, titled occurrences up to the requested limit", () => {
        expect(createEmptyEventFilterState()).toEqual({
            taxonomyGroup: null,
            eventTypeIds: [],
            organizerGroupIds: [],
        })
        const past = makeOccurrence("past", { startsAt: "2026-09-03T17:00:00.000Z" })
        const future = makeOccurrence("future", { startsAt: "2026-09-05T17:00:00.000Z" })
        expect(
            pickHomeEvents([past, future], { now: new Date("2026-09-04T12:00:00Z") }).map(
                item => item.id,
            ),
        ).toEqual(["future"])
    })
})
