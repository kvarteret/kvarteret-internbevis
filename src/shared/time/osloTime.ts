// The only module in the app allowed to say "Europe/Oslo". Converts between
// UTC instants and Oslo wall-clock time via Intl.DateTimeFormat, which gives
// exact DST handling (the previous month-based CET/CEST guess was wrong for up
// to a week around each transition). Hermes ships full Intl on both platforms.

const OSLO_TIME_ZONE = "Europe/Oslo"

export interface OsloWallClock {
    year: number
    month: number
    day: number
    hour: number
    minute: number
    /** 0 = Sunday … 6 = Saturday, matching Date#getDay. */
    weekday: number
}

const WEEKDAY_INDEX: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
}

const wallClockFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: OSLO_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
})

export const osloWallClock = (date: Date): OsloWallClock => {
    const parts = new Map(
        wallClockFormatter.formatToParts(date).map(part => [part.type, part.value]),
    )

    return {
        year: Number(parts.get("year")),
        month: Number(parts.get("month")),
        day: Number(parts.get("day")),
        // Some ICU versions render midnight as "24" with hour12: false.
        hour: Number(parts.get("hour")) % 24,
        minute: Number(parts.get("minute")),
        weekday: WEEKDAY_INDEX[parts.get("weekday") ?? ""] ?? 0,
    }
}

const wallClockAsUtcMs = (wallClock: OsloWallClock): number =>
    Date.UTC(wallClock.year, wallClock.month - 1, wallClock.day, wallClock.hour, wallClock.minute)

/** Oslo's UTC offset in minutes at the given instant (+60 CET, +120 CEST). */
export const getOsloUtcOffsetMinutes = (date: Date): number => {
    const wallClockMs = wallClockAsUtcMs(osloWallClock(date))
    // Seconds/milliseconds are dropped by the formatter; truncate the instant
    // the same way so the difference is a whole number of minutes.
    const instantMs = Math.floor(date.getTime() / 60_000) * 60_000
    return Math.round((wallClockMs - instantMs) / 60_000)
}

/**
 * The UTC instant at which an Oslo wall-clock date and "HH:mm" time occurs.
 * Replaces the month-based offset guess: correct on both DST boundaries.
 */
export const toOsloDate = (dateStr: string, time: string | null): Date => {
    const [yearStr, monthStr, dayStr] = dateStr.split("-")
    const [hourStr, minuteStr] = (time ?? "00:00").split(":")
    const wallClockMs = Date.UTC(
        Number(yearStr),
        Number(monthStr ?? "1") - 1,
        Number(dayStr ?? "1"),
        Number(hourStr ?? "0"),
        Number(minuteStr ?? "0"),
    )

    // Two-pass conversion: guess the offset at the wall-clock instant read as
    // UTC, then re-derive it at the corrected instant so dates on the far side
    // of a DST transition resolve with the post-transition offset.
    const firstGuess = wallClockMs - getOsloUtcOffsetMinutes(new Date(wallClockMs)) * 60_000
    const offsetMinutes = getOsloUtcOffsetMinutes(new Date(firstGuess))
    return new Date(wallClockMs - offsetMinutes * 60_000)
}
