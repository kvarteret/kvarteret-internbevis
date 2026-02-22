import { useIsFocused } from "@react-navigation/native"
import { useQuery } from "@tanstack/react-query"
import { AppState } from "react-native"
import { useCallback, useEffect, useMemo, useState } from "react"
import { fetchNowPlaying } from "@/features/now-playing/data/nowPlayingRepository"
import { openExternalUrl } from "@/core/linking/linkClient"

const POLL_INTERVAL_MS = 1000

const clampProgress = (value: number | null): number => {
    if (value === null || !Number.isFinite(value)) {
        return 0
    }

    return Math.min(100, Math.max(0, value))
}

export const useNowPlayingScreenVM = () => {
    const isFocused = useIsFocused()
    const [isAppActive, setIsAppActive] = useState(AppState.currentState === "active")

    useEffect(() => {
        const subscription = AppState.addEventListener("change", nextState => {
            setIsAppActive(nextState === "active")
        })

        return () => {
            subscription.remove()
        }
    }, [])

    const queryEnabled = isFocused && isAppActive

    const {
        data: nowPlaying,
        error,
        isPending,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["now-playing"],
        queryFn: ({ signal }) => fetchNowPlaying(signal),
        enabled: queryEnabled,
        refetchInterval: queryEnabled ? POLL_INTERVAL_MS : false,
        refetchIntervalInBackground: false,
        retry: 1,
    })

    const errorMessage = isError ? (error instanceof Error ? error.message : String(error)) : null

    const progressWidth = `${clampProgress(nowPlaying?.progressPercent ?? 0)}%` as `${number}%`
    const hasData = Boolean(nowPlaying)
    const isAuthorized = Boolean(nowPlaying?.authorized)
    const isPlayingTrack = Boolean(nowPlaying?.playing)

    const showUnauthorized = !isPending && !isError && hasData && !isAuthorized
    const showIdle = !isPending && !isError && hasData && isAuthorized && !isPlayingTrack
    const showPlaying = !isPending && !isError && hasData && isAuthorized && isPlayingTrack

    const openSpotifyConnect = useCallback(async (): Promise<void> => {
        if (!nowPlaying?.connectUrl) {
            return
        }

        await openExternalUrl(nowPlaying.connectUrl)
    }, [nowPlaying?.connectUrl])

    return {
        state: {
            nowPlaying,
            isPending,
            errorMessage,
            progressWidth,
            showUnauthorized,
            showIdle,
            showPlaying,
        },
        actions: {
            refresh: async () => refetch(),
            openSpotifyConnect,
        },
    }
}
