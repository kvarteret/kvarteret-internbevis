import { NowPlayingState } from "../../types/nowPlaying"

function hasTrackMetadata(nowPlaying: NowPlayingState): boolean {
    const name = nowPlaying.name?.trim() ?? ""
    const artists = nowPlaying.artists?.trim() ?? ""
    return name.length > 0 && artists.length > 0
}

export function shouldShowNowPlayingWidget(
    nowPlaying: NowPlayingState | null | undefined,
): boolean {
    if (!nowPlaying) {
        return false
    }

    if (!nowPlaying.authorized || !nowPlaying.playing || !nowPlaying.isPlaying) {
        return false
    }

    return hasTrackMetadata(nowPlaying)
}
