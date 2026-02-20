import { Platform } from "react-native"

export const isIOS = Platform.OS === "ios"

export const platformUi = {
    sectionSpacing: isIOS ? 12 : 10,
    screenHorizontalPadding: isIOS ? 16 : 14,
    surfaceRadius: isIOS ? 16 : 14,
    surfaceBorderWidth: isIOS ? 0.5 : 1,
    carouselCardWidthRatio: isIOS ? 0.78 : 0.82,
    minCarouselCardWidth: 240,
    carouselCardGap: 12,
} as const
