import { shouldShowNowPlayingWidget } from "../../components/home/nowPlayingWidgetGuard"
import { NowPlayingState } from "../../types/nowPlaying"

function createNowPlaying(overrides?: Partial<NowPlayingState>): NowPlayingState {
    return {
        authorized: true,
        playing: true,
        isPlaying: true,
        name: "Track Name",
        artists: "Artist",
        album: "Album",
        image: "https://example.com/image.jpg",
        progressMs: 1000,
        durationMs: 2000,
        progressPercent: 50,
        connectUrl: "https://kvarteret.no/login",
        ...overrides,
    }
}

describe("shouldShowNowPlayingWidget", () => {
    test("returns false for missing data", () => {
        expect(shouldShowNowPlayingWidget(null)).toBe(false)
        expect(shouldShowNowPlayingWidget(undefined)).toBe(false)
    })

    test("returns false for unauthorized or idle payload", () => {
        expect(shouldShowNowPlayingWidget(createNowPlaying({ authorized: false }))).toBe(false)
        expect(shouldShowNowPlayingWidget(createNowPlaying({ playing: false }))).toBe(false)
        expect(shouldShowNowPlayingWidget(createNowPlaying({ isPlaying: false }))).toBe(false)
    })

    test("returns false for malformed track metadata", () => {
        expect(shouldShowNowPlayingWidget(createNowPlaying({ name: " " }))).toBe(false)
        expect(shouldShowNowPlayingWidget(createNowPlaying({ artists: "" }))).toBe(false)
    })

    test("returns true for valid now-playing payload", () => {
        expect(shouldShowNowPlayingWidget(createNowPlaying())).toBe(true)
    })
})
