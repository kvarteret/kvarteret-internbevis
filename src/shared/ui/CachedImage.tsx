import { Image as ExpoImage } from "expo-image"
import React from "react"
import { withUniwind } from "uniwind"

const UniwindImage = withUniwind(ExpoImage)

type CachedImageProps = React.ComponentProps<typeof UniwindImage>

export const CachedImage = ({
    cachePolicy = "memory-disk",
    transition = 120,
    ...props
}: CachedImageProps): React.JSX.Element => (
    <UniwindImage cachePolicy={cachePolicy} transition={transition} {...props} />
)
