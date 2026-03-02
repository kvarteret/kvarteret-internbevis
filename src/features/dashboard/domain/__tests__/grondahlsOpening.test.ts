import {
    isWithinGrondahlsOpeningHours,
    shouldShowGrondahlsStatusCard,
} from "../grondahlsOpening"
import type { NowPlayingState } from "@/features/now-playing/data/nowPlayingRepository"

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

describe("grondahlsOpening", () => {
    test("shows within weekday opening hours", () => {
        expect(isWithinGrondahlsOpeningHours(new Date(2026, 2, 2, 20, 0, 0))).toBe(true)
    })

    test("shows during weekday spillover after midnight", () => {
        expect(isWithinGrondahlsOpeningHours(new Date(2026, 2, 7, 0, 30, 0))).toBe(true)
    })

    test("hides before weekday opening", () => {
        expect(isWithinGrondahlsOpeningHours(new Date(2026, 2, 2, 19, 59, 0))).toBe(false)
    })

    test("hides at weekday closing time", () => {
        expect(isWithinGrondahlsOpeningHours(new Date(2026, 2, 7, 1, 0, 0))).toBe(false)
    })

    test("shows within saturday opening hours", () => {
        expect(isWithinGrondahlsOpeningHours(new Date(2026, 2, 7, 21, 0, 0))).toBe(true)
    })

    test("shows during saturday spillover after midnight", () => {
        expect(isWithinGrondahlsOpeningHours(new Date(2026, 2, 8, 1, 30, 0))).toBe(true)
    })

    test("hides at saturday closing time", () => {
        expect(isWithinGrondahlsOpeningHours(new Date(2026, 2, 8, 2, 0, 0))).toBe(false)
    })

    test("requires active playback to show the card", () => {
        const now = new Date(2026, 2, 2, 20, 30, 0)

        expect(shouldShowGrondahlsStatusCard(createNowPlayingState(), now)).toBe(true)
        expect(
            shouldShowGrondahlsStatusCard(
                createNowPlayingState({ isPlaybackActive: false }),
                now,
            ),
        ).toBe(false)
    })
})
