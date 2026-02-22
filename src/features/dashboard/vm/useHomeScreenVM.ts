import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useIsFocused } from "@react-navigation/native"
import { useWindowDimensions } from "react-native"
import { useSession } from "@/app/providers/SessionProvider"
import { openExternalUrl } from "@/core/linking/linkClient"
import { fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"
import { fetchNowPlaying } from "@/features/now-playing/data/nowPlayingRepository"

const NOW_PLAYING_POLL_INTERVAL_MS = 10_000

const clampProgress = (value: number | null): number => {
    if (value === null || !Number.isFinite(value)) {
        return 0
    }

    return Math.min(100, Math.max(0, value))
}

export const useHomeScreenVM = () => {
    const isFocused = useIsFocused()
    const { user, isLoading, logout } = useSession()
    const { height, width } = useWindowDimensions()
    const [menuVisible, setMenuVisible] = useState(false)
    const [languageSelectorVisible, setLanguageSelectorVisible] = useState(false)
    const [animationTrigger, setAnimationTrigger] = useState(0)

    const isSmallScreen = height < 600
    const headerLogoWidth = Math.min(280, Math.max(170, width - 120))

    const {
        data: events,
        isPending: eventsPending,
        isError: eventsError,
        refetch: refetchEvents,
    } = useQuery({
        queryKey: ["home-events"],
        queryFn: ({ signal }) => fetchHomeEvents(signal),
        staleTime: 30_000,
        retry: 1,
    })

    const { data: nowPlaying, isError: nowPlayingError } = useQuery({
        queryKey: ["home-now-playing"],
        queryFn: ({ signal }) => fetchNowPlaying(signal),
        enabled: isFocused,
        refetchInterval: isFocused ? NOW_PLAYING_POLL_INTERVAL_MS : false,
        refetchIntervalInBackground: false,
        staleTime: 5_000,
        retry: 1,
    })

    const showNowPlayingWidget = Boolean(
        nowPlaying &&
            !nowPlayingError &&
            nowPlaying.authorized &&
            nowPlaying.hasTrack &&
            nowPlaying.isPlaybackActive,
    )
    const nowPlayingProgressWidth = `${clampProgress(nowPlaying?.progressPercent ?? 0)}%` as `${number}%`

    return {
        state: {
            user,
            isLoading,
            isSmallScreen,
            headerLogoWidth,
            menuVisible,
            languageSelectorVisible,
            animationTrigger,
            events,
            eventsPending,
            eventsError,
            nowPlaying,
            showNowPlayingWidget,
            nowPlayingProgressWidth,
        },
        actions: {
            openVolunteerPage: async () => openExternalUrl("https://blifrivillig.no"),
            openMenu: () => setMenuVisible(true),
            closeMenu: () => setMenuVisible(false),
            openLanguage: () => setLanguageSelectorVisible(true),
            closeLanguage: () => setLanguageSelectorVisible(false),
            logout: async () => logout(),
            triggerAvatarAnimation: () => setAnimationTrigger(previous => previous + 1),
            retryEvents: async () => refetchEvents(),
        },
    }
}
