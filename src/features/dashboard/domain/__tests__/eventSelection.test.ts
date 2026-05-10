import { KvarteretEventDocument, SanityArrangementDate } from "@/features/dashboard/domain/types"
import {
    buildEventFeedSections,
    buildUpcomingDateChips,
    createEmptyEventFilterState,
    deriveTaxonomyFromEvents,
    filterEvents,
    parsePersistedEventFilterState,
    pickHomeEvents,
} from "../eventSelection"

function makeDate(isoString: string): SanityArrangementDate {
    // isoString like "2026-05-01T18:00:00.000Z" — extract Oslo date/time approximately
    const d = new Date(isoString)
    const startDate = d.toISOString().split("T")[0]!
    const startTime = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
    return { _key: `d-${isoString}`, startDate, startTime, endTime: null }
}

function createEvent(
    id: string,
    options?: {
        dates?: SanityArrangementDate[]
        start?: Date
        end?: Date
        title?: string
        eventTypeId?: string
        eventTypeName?: string
        taxonomyGroup?: string
        organizerGroupId?: string
        isRecurring?: boolean
        extraDates?: Date[]
    },
): KvarteretEventDocument {
    const primaryDate = options?.start
        ? makeDate(options.start.toISOString())
        : makeDate("2026-02-20T12:00:00.000Z")

    const extraDates = (options?.extraDates ?? []).map(d => makeDate(d.toISOString()))

    const dates = options?.dates ?? [primaryDate, ...extraDates]

    return {
        _id: id,
        title: options?.title ?? `Event ${id}`,
        slug: `event-${id}`,
        dates,
        isRecurring: options?.isRecurring ?? null,
        rrule: null,
        isFree: null,
        priceOrdinar: null,
        priceStudent: null,
        priceMedlem: null,
        ticketUrl: null,
        facebookUrl: null,
        imageUrl: null,
        imageCaption: null,
        room: null,
        roomText: null,
        organizerGroup: options?.organizerGroupId
            ? {
                  _id: options.organizerGroupId,
                  name: options.organizerGroupId,
                  slug: options.organizerGroupId,
              }
            : null,
        organizerText: null,
        eventType: options?.eventTypeId
            ? {
                  _id: options.eventTypeId,
                  name: options.eventTypeName ?? options.eventTypeId,
                  slug: options.eventTypeId,
                  taxonomyGroup: options?.taxonomyGroup
                      ? {
                            _id: options.taxonomyGroup,
                            name: options.taxonomyGroup,
                            slug: options.taxonomyGroup.toLowerCase(),
                        }
                      : null,
              }
            : null,
        description: null,
    }
}

describe("eventsService", () => {
    test("pickHomeEvents excludes events whose first date is in the past", () => {
        const now = new Date("2026-02-20T12:00:00.000Z")
        // Past event: startDate before now
        const ended = createEvent("ended", { start: new Date("2026-02-19T08:00:00.000Z") })
        const active = createEvent("active", { start: new Date("2026-02-20T14:00:00.000Z") })

        const result = pickHomeEvents([ended, active], { now })
        expect(result.map(e => e._id)).toEqual(["active"])
    })

    test("pickHomeEvents returns at most 5 events", () => {
        const base = new Date("2026-02-20T12:00:00.000Z")
        const events = Array.from({ length: 7 }, (_, i) =>
            createEvent(String(i + 1), {
                start: new Date(base.getTime() + i * 60 * 60 * 1000),
            }),
        )

        const result = pickHomeEvents(events, { now: base })
        expect(result).toHaveLength(5)
    })

    test("deriveTaxonomyFromEvents groups event types by taxonomy group", () => {
        const music = createEvent("music", {
            eventTypeId: "konsert",
            eventTypeName: "Konsert",
            taxonomyGroup: "Musikk",
        })
        const debate = createEvent("debate", {
            eventTypeId: "debatt",
            eventTypeName: "Debatt",
            taxonomyGroup: "Faglig",
        })
        const organizedEvent = createEvent("org", {
            eventTypeId: "møte",
            eventTypeName: "Møte",
            taxonomyGroup: "Faglig",
            organizerGroupId: "styret",
        })

        const taxonomy = deriveTaxonomyFromEvents([music, debate, organizedEvent])

        const groupNames = taxonomy.taxonomyGroups.map(g => g.name)
        expect(groupNames).toContain("Musikk")
        expect(groupNames).toContain("Faglig")

        const faglig = taxonomy.taxonomyGroups.find(g => g.name === "Faglig")
        expect(faglig?.eventTypes.map(t => t._id).sort()).toEqual(["debatt", "møte"].sort())

        expect(taxonomy.organizerGroups.map(g => g._id)).toEqual(["styret"])
    })

    test("deriveTaxonomyFromEvents orders taxonomy groups per TAXONOMY_GROUP_ORDER", () => {
        const social = createEvent("s", { eventTypeId: "fest", taxonomyGroup: "Sosialt" })
        const music = createEvent("m", { eventTypeId: "konsert", taxonomyGroup: "Musikk" })
        const other = createEvent("o", { eventTypeId: "annet", taxonomyGroup: "Annet" })

        const taxonomy = deriveTaxonomyFromEvents([social, other, music])
        const names = taxonomy.taxonomyGroups.map(g => g.name)

        // Musikk (index 0) should appear before Sosialt (index 3), Annet is fallback last
        expect(names.indexOf("Musikk")).toBeLessThan(names.indexOf("Sosialt"))
        expect(names.indexOf("Sosialt")).toBeLessThan(names.indexOf("Annet"))
    })

    test("filterEvents applies taxonomy group filter", () => {
        const music = createEvent("music", { eventTypeId: "konsert", taxonomyGroup: "Musikk" })
        const debate = createEvent("debate", { eventTypeId: "debatt", taxonomyGroup: "Faglig" })

        expect(
            filterEvents([music, debate], {
                ...createEmptyEventFilterState(),
                taxonomyGroup: "Musikk",
            }).map(e => e._id),
        ).toEqual(["music"])
    })

    test("filterEvents applies event type id filter", () => {
        const music = createEvent("music", { eventTypeId: "konsert" })
        const debate = createEvent("debate", { eventTypeId: "debatt" })

        expect(
            filterEvents([music, debate], {
                ...createEmptyEventFilterState(),
                eventTypeIds: ["debatt"],
            }).map(e => e._id),
        ).toEqual(["debate"])
    })

    test("filterEvents applies organizer group id filter", () => {
        const music = createEvent("music", { organizerGroupId: "asf" })
        const debate = createEvent("debate", { organizerGroupId: "debatt-klubben" })

        expect(
            filterEvents([music, debate], {
                ...createEmptyEventFilterState(),
                organizerGroupIds: ["asf"],
            }).map(e => e._id),
        ).toEqual(["music"])
    })

    test("parsePersistedEventFilterState accepts valid saved filters and rejects invalid shapes", () => {
        expect(
            parsePersistedEventFilterState({
                eventTypeIds: ["konsert", "konsert"],
                organizerGroupIds: ["asf"],
                taxonomyGroup: "Musikk",
            }),
        ).toEqual({
            eventTypeIds: ["konsert"],
            organizerGroupIds: ["asf"],
            taxonomyGroup: "Musikk",
        })

        expect(parsePersistedEventFilterState({ eventTypeIds: ["konsert"] })).toBeNull()
        expect(parsePersistedEventFilterState(null)).toBeNull()
    })

    test("buildEventFeedSections maps events preserving order", () => {
        const a = createEvent("a")
        const b = createEvent("b")
        const c = createEvent("c")

        const result = buildEventFeedSections([a, b, c])

        expect(result.rest.map(entry => entry.event._id)).toEqual(["a", "b", "c"])
    })

    test("buildEventFeedSections puts extra dates from dates array into upcomingDates", () => {
        const quiz = createEvent("quiz", {
            start: new Date("2026-05-01T18:00:00.000Z"),
            extraDates: [
                new Date("2026-05-08T18:00:00.000Z"),
                new Date("2026-05-15T18:00:00.000Z"),
            ],
        })

        const result = buildEventFeedSections([quiz])

        expect(result.rest).toHaveLength(1)
        expect(result.rest[0]!.upcomingDates).toHaveLength(2)
    })

    test("buildUpcomingDateChips formats first two dates and counts the rest", () => {
        const d1 = new Date("2026-05-05T18:00:00.000Z")
        const d2 = new Date("2026-05-12T18:00:00.000Z")
        const d3 = new Date("2026-05-19T18:00:00.000Z")
        const d4 = new Date("2026-05-26T18:00:00.000Z")

        expect(buildUpcomingDateChips([])).toEqual([])
        expect(buildUpcomingDateChips([d1])).toHaveLength(1)
        expect(buildUpcomingDateChips([d1, d2])).toHaveLength(2)
        expect(buildUpcomingDateChips([d1, d2, d3])).toEqual([
            expect.stringMatching(/\d+\. /),
            expect.stringMatching(/\d+\. /),
            "+1",
        ])
        expect(buildUpcomingDateChips([d1, d2, d3, d4])).toContain("+2")
    })

    test("buildUpcomingDateChips caps overflow badge at 9+", () => {
        const dates = Array.from({ length: 12 }, (_, i) => new Date(2026, 4, i + 1))
        const chips = buildUpcomingDateChips(dates)
        expect(chips[chips.length - 1]).toBe("9+")
    })

    test("buildEventFeedSections expands rrule from past anchor into future upcomingDates", () => {
        // Anchor date is well in the past; rrule is weekly on Tuesdays.
        // expandRruleUpcomingDates must produce future dates regardless.
        const weekly: KvarteretEventDocument = {
            ...createEvent("weekly"),
            dates: [{ _key: "d1", startDate: "2024-01-09", startTime: "19:00", endTime: "22:00" }],
            isRecurring: true,
            rrule: "FREQ=WEEKLY;BYDAY=TU",
        }

        const result = buildEventFeedSections([weekly])

        expect(result.rest[0]!.upcomingDates.length).toBeGreaterThan(0)
        // All returned dates must be in the future
        const now = new Date()
        for (const d of result.rest[0]!.upcomingDates) {
            expect(d.getTime()).toBeGreaterThan(now.getTime())
        }
    })

    test("pickHomeEvents includes recurring events even when anchor date is in the past", () => {
        const now = new Date("2026-05-10T12:00:00.000Z")
        const recurring: KvarteretEventDocument = {
            ...createEvent("weekly"),
            dates: [{ _key: "d1", startDate: "2024-01-09", startTime: "19:00", endTime: null }],
            isRecurring: true,
            rrule: "FREQ=WEEKLY;BYDAY=TU",
        }

        const result = pickHomeEvents([recurring], { now })

        expect(result.map(e => e._id)).toContain("weekly")
    })
})
