import { osloWallClock } from "@/shared/time/osloTime"

// Structural subset of the now-playing repository's NowPlayingState; declared
// here so the domain layer does not depend on the data layer.
export interface NowPlayingSnapshot {
    authorized: boolean
    hasTrack: boolean
    isPlaybackActive: boolean
}

const WEEKDAY_OPEN_MINUTES = 20 * 60
const WEEKDAY_CLOSE_MINUTES = 1 * 60
const SATURDAY_OPEN_MINUTES = 21 * 60
const SATURDAY_CLOSE_MINUTES = 2 * 60

const isWeekday = (day: number): boolean => day >= 1 && day <= 5

export const isWithinGrondahlsOpeningHours = (now: Date): boolean => {
    // The bar is in Bergen: evaluate opening hours in Oslo time, not device time.
    const wallClock = osloWallClock(now)
    const day = wallClock.weekday
    const minutes = wallClock.hour * 60 + wallClock.minute
    const previousDay = (day + 6) % 7

    if (isWeekday(day) && minutes >= WEEKDAY_OPEN_MINUTES) {
        return true
    }

    if (day === 6 && minutes >= SATURDAY_OPEN_MINUTES) {
        return true
    }

    if (isWeekday(previousDay) && minutes < WEEKDAY_CLOSE_MINUTES) {
        return true
    }

    if (previousDay === 6 && minutes < SATURDAY_CLOSE_MINUTES) {
        return true
    }

    return false
}

export const shouldShowGrondahlsStatusCard = (
    nowPlaying: NowPlayingSnapshot | null | undefined,
    now: Date = new Date(),
): boolean =>
    Boolean(
        nowPlaying &&
            nowPlaying.authorized &&
            nowPlaying.hasTrack &&
            nowPlaying.isPlaybackActive &&
            isWithinGrondahlsOpeningHours(now),
    )
