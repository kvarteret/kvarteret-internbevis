import { resolveEventDocument } from "@/features/dashboard/domain/eventResolution"
import type { RawKvarteretEventDocument } from "@/features/dashboard/domain/types"

const createChild = (
    overrides: Partial<RawKvarteretEventDocument> = {},
): RawKvarteretEventDocument => ({
    _id: "child",
    eventKind: "seriesInstance",
    eventStatus: "scheduled",
    parent: {
        _id: "parent",
        slug: "weekly-quiz",
        eventKind: "seriesParent",
        eventStatus: "scheduled",
        title: "Weekly quiz",
        description: null,
        imageUrl: "https://cdn.sanity.io/quiz.jpg",
        imageCaption: null,
        organizerGroup: null,
        organizerText: "Kvarteret",
        eventType: null,
        isFree: true,
        priceOrdinar: null,
        priceStudent: null,
        priceMedlem: null,
        ticketUrl: null,
        facebookUrl: null,
        isInternalEvent: false,
    },
    title: null,
    slug: "weekly-quiz-2026-08-03-1900",
    dates: [{ _key: "date", startDate: "2026-08-03", startTime: "19:00", endTime: null }],
    isRecurring: false,
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
    organizerGroup: null,
    organizerText: null,
    eventType: null,
    description: null,
    isInternalEvent: null,
    ...overrides,
})

describe("resolveEventDocument", () => {
    test("inherits display fields omitted by a materialized child", () => {
        const resolved = resolveEventDocument(createChild())

        expect(resolved.title).toBe("Weekly quiz")
        expect(resolved.imageUrl).toBe("https://cdn.sanity.io/quiz.jpg")
        expect(resolved.organizerText).toBe("Kvarteret")
        expect(resolved.isFree).toBe(true)
    })

    test("preserves explicit falsy child overrides", () => {
        const resolved = resolveEventDocument(createChild({ title: "Special quiz", isFree: false }))

        expect(resolved.title).toBe("Special quiz")
        expect(resolved.isFree).toBe(false)
    })

    test("inherits a non-scheduled parent status when the child is scheduled", () => {
        const child = createChild()
        const resolved = resolveEventDocument({
            ...child,
            parent: child.parent ? { ...child.parent, eventStatus: "cancelled" } : null,
        })

        expect(resolved.eventStatus).toBe("cancelled")
    })

    test("keeps a child-specific non-scheduled status", () => {
        const child = createChild({ eventStatus: "postponed" })
        const resolved = resolveEventDocument({
            ...child,
            parent: child.parent ? { ...child.parent, eventStatus: "cancelled" } : null,
        })

        expect(resolved.eventStatus).toBe("postponed")
    })
})
