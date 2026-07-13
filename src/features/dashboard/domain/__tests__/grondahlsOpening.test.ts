import type { NowPlayingState } from "@/features/dashboard/data/nowPlayingRepository"
import { isWithinGrondahlsOpeningHours, shouldShowGrondahlsStatusCard } from "../grondahlsOpening"

const createNowPlayingState = (overrides?: Partial<NowPlayingState>): NowPlayingState => ({
    authorized: true,
    hasTrack: true,
    isPlaybackActive: true,
    name: "Track",
    artists: "Artist",
    album: "Album",
    image: null,
    progressMs: 10_000,
    durationMs: 20_000,
    progressPercent: 50,
    connectUrl: "https://example.com",
    ...overrides,
})

// Opening hours are evaluated in Europe/Oslo wall-clock time, so the tests use
// explicit UTC instants with the Oslo local time noted alongside. Early March
// 2026 is CET (UTC+1); mid-July is CEST (UTC+2).

describe("grondahlsOpening", () => {
    test("shows within weekday opening hours", () => {
        // Monday 2026-03-02 20:00 Oslo
        expect(isWithinGrondahlsOpeningHours(new Date("2026-03-02T19:00:00Z"))).toBe(true)
    })

    test("shows during weekday spillover after midnight", () => {
        // Saturday 2026-03-07 00:30 Oslo (Friday night spillover)
        expect(isWithinGrondahlsOpeningHours(new Date("2026-03-06T23:30:00Z"))).toBe(true)
    })

    test("hides before weekday opening", () => {
        // Monday 2026-03-02 19:59 Oslo
        expect(isWithinGrondahlsOpeningHours(new Date("2026-03-02T18:59:00Z"))).toBe(false)
    })

    test("hides at weekday closing time", () => {
        // Saturday 2026-03-07 01:00 Oslo
        expect(isWithinGrondahlsOpeningHours(new Date("2026-03-07T00:00:00Z"))).toBe(false)
    })

    test("shows within saturday opening hours", () => {
        // Saturday 2026-03-07 21:00 Oslo
        expect(isWithinGrondahlsOpeningHours(new Date("2026-03-07T20:00:00Z"))).toBe(true)
    })

    test("shows during saturday spillover after midnight", () => {
        // Sunday 2026-03-08 01:30 Oslo
        expect(isWithinGrondahlsOpeningHours(new Date("2026-03-08T00:30:00Z"))).toBe(true)
    })

    test("hides at saturday closing time", () => {
        // Sunday 2026-03-08 02:00 Oslo
        expect(isWithinGrondahlsOpeningHours(new Date("2026-03-08T01:00:00Z"))).toBe(false)
    })

    test("evaluates in Oslo time during CEST too", () => {
        // Wednesday 2026-07-15 20:00 Oslo is 18:00 UTC in summer
        expect(isWithinGrondahlsOpeningHours(new Date("2026-07-15T18:00:00Z"))).toBe(true)
        // 19:59 Oslo the same evening
        expect(isWithinGrondahlsOpeningHours(new Date("2026-07-15T17:59:00Z"))).toBe(false)
    })

    test("requires active playback to show the card", () => {
        // Monday 2026-03-02 20:30 Oslo
        const now = new Date("2026-03-02T19:30:00Z")

        expect(shouldShowGrondahlsStatusCard(createNowPlayingState(), now)).toBe(true)
        expect(
            shouldShowGrondahlsStatusCard(createNowPlayingState({ isPlaybackActive: false }), now),
        ).toBe(false)
    })
})
