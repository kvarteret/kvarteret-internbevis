export interface NowPlayingApiResponse {
    authorized: boolean
    playing: boolean
    isPlaying: boolean
    name: string | null
    artists: string | null
    album: string | null
    image: string | null
    progressMs: number | null
    durationMs: number | null
    progressPercent: number | null
    connectUrl: string
}

export interface NowPlayingState extends NowPlayingApiResponse {}
