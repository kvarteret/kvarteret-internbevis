import React from "react"
import { NowPlayingState } from "@/features/dashboard/data/nowPlayingRepository"
import { NowPlayingWidget } from "@/features/dashboard/ui/components/NowPlayingWidget"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"

interface OpeningStatusHeroProps {
    title: string
    nowPlaying: NowPlayingState | null
    progressWidth: `${number}%`
}

export const OpeningStatusHero = ({
    title,
    nowPlaying,
    progressWidth,
}: OpeningStatusHeroProps): React.JSX.Element => {
    return (
        <Card
            className="w-full gap-3 rounded-3xl bg-editorial-surface px-4 py-4"
            effect="liquid"
            variant="grouped"
        >
            <Text className="text-3xl leading-tight text-editorial-ink font-black">{title}</Text>
            {nowPlaying ? (
                <NowPlayingWidget nowPlaying={nowPlaying} progressWidth={progressWidth} />
            ) : null}
        </Card>
    )
}
