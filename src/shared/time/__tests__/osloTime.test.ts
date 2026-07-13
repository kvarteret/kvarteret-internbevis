import { getOsloUtcOffsetMinutes, osloWallClock, toOsloDate } from "../osloTime"

// Europe/Oslo 2026 DST transitions: spring forward on Sunday 2026-03-29
// (02:00 CET → 03:00 CEST) and fall back on Sunday 2026-10-25 (03:00 CEST →
// 02:00 CET). The retired month-based approximation treated all of March as
// CET and all of October as CEST, so both boundary weekends were wrong.

describe("getOsloUtcOffsetMinutes", () => {
    it("is CET (+60) in plain winter", () => {
        expect(getOsloUtcOffsetMinutes(new Date("2026-01-15T12:00:00Z"))).toBe(60)
    })

    it("is CEST (+120) in plain summer", () => {
        expect(getOsloUtcOffsetMinutes(new Date("2026-07-15T12:00:00Z"))).toBe(120)
    })

    it("is still CET just before the March transition", () => {
        expect(getOsloUtcOffsetMinutes(new Date("2026-03-29T00:59:00Z"))).toBe(60)
    })

    it("is CEST right after the March transition", () => {
        expect(getOsloUtcOffsetMinutes(new Date("2026-03-29T01:00:00Z"))).toBe(120)
    })

    it("is still CEST just before the October transition", () => {
        expect(getOsloUtcOffsetMinutes(new Date("2026-10-25T00:59:00Z"))).toBe(120)
    })

    it("is CET right after the October transition", () => {
        expect(getOsloUtcOffsetMinutes(new Date("2026-10-25T01:00:00Z"))).toBe(60)
    })
})

describe("toOsloDate", () => {
    it("resolves a winter wall-clock time as CET", () => {
        expect(toOsloDate("2026-01-15", "20:00").toISOString()).toBe("2026-01-15T19:00:00.000Z")
    })

    it("resolves a summer wall-clock time as CEST", () => {
        expect(toOsloDate("2026-07-15", "20:00").toISOString()).toBe("2026-07-15T18:00:00.000Z")
    })

    it("uses CEST on the March transition day after the switch (old code said CET is wrong here)", () => {
        // 2026-03-29 is March, which the month-based rule mapped to CET (+1);
        // by 12:00 Oslo has already sprung forward to CEST (+2).
        expect(toOsloDate("2026-03-29", "12:00").toISOString()).toBe("2026-03-29T10:00:00.000Z")
    })

    it("uses CET on the October transition day after the switch (old code said CEST is wrong here)", () => {
        // 2026-10-25 is October, which the month-based rule mapped to CEST (+2);
        // by 12:00 Oslo has already fallen back to CET (+1).
        expect(toOsloDate("2026-10-25", "12:00").toISOString()).toBe("2026-10-25T11:00:00.000Z")
    })

    it("keeps CET in the evening before the March transition", () => {
        expect(toOsloDate("2026-03-28", "20:00").toISOString()).toBe("2026-03-28T19:00:00.000Z")
    })

    it("keeps CEST in the evening before the October transition", () => {
        expect(toOsloDate("2026-10-24", "20:00").toISOString()).toBe("2026-10-24T18:00:00.000Z")
    })

    it("defaults a missing time to midnight", () => {
        expect(toOsloDate("2026-01-15", null).toISOString()).toBe("2026-01-14T23:00:00.000Z")
    })
})

describe("osloWallClock", () => {
    it("reads Oslo wall-clock fields including the weekday", () => {
        // 2026-03-06 is a Friday; 23:30 UTC in winter is 00:30 Saturday in Oslo.
        const wallClock = osloWallClock(new Date("2026-03-06T23:30:00Z"))

        expect(wallClock).toEqual({
            year: 2026,
            month: 3,
            day: 7,
            hour: 0,
            minute: 30,
            weekday: 6,
        })
    })
})
