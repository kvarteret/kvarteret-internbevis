import { useQuery } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { useWindowDimensions } from "react-native"
import { useSession } from "@/app/providers/SessionProvider"
import { openExternalUrl } from "@/core/linking/linkClient"
import { fetchHomeEvents } from "@/features/dashboard/data/eventsRepository"

export const useHomeScreenVM = () => {
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
