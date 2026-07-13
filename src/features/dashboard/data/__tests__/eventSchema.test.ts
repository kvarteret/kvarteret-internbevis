import { parseRawEvent } from "@/features/dashboard/data/eventSchema"

describe("eventSchema", () => {
    test("rejects a response that does not follow the current arrangement projection", () => {
        expect(() => parseRawEvent({ _id: "event-without-contract-fields" })).toThrow()
    })

    test("normalizes Portable Text marks omitted by Sanity", () => {
        const event = parseRawEvent({
            _id: "event-1",
            eventKind: "single",
            eventStatus: "scheduled",
            parent: null,
            slug: "event-1",
            dates: [],
            isRecurring: false,
            rrule: null,
            room: null,
            roomText: null,
            title: "Event",
            description: [
                {
                    _key: "block-1",
                    _type: "block",
                    style: "normal",
                    children: [{ _key: "span-1", _type: "span", text: "Description" }],
                    markDefs: [],
                },
            ],
            imageUrl: null,
            imageCaption: null,
            organizerGroup: null,
            organizerText: null,
            eventType: null,
            isFree: null,
            priceOrdinar: null,
            priceStudent: null,
            priceMedlem: null,
            ticketUrl: null,
            facebookUrl: null,
            isInternalEvent: null,
        })

        expect(event.description?.[0]?.children[0]?.marks).toEqual([])
    })
})
