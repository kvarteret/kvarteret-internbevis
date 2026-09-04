jest.mock("@expo/vector-icons", () => ({
    MaterialIcons: () => null,
}))
jest.mock("@/shared/theme/use-theme-runtime-colors", () => ({
    useThemeRuntimeColors: () => ({ textSecondary: "#6b7280" }),
}))
jest.mock("@/shared/ui/CachedImage", () => ({
    CachedImage: (props: { cachePolicy?: string; recyclingKey?: string; source?: string }) => {
        const { View: MockView } = require("react-native") as typeof import("react-native")

        return <MockView testID="cached-image" {...props} />
    },
}))

import { render, screen } from "@testing-library/react-native"
import { ProfileAvatar } from "../ProfileAvatar"

describe("ProfileAvatar", () => {
    it("uses disk caching and a stable key for signed remote image URLs", () => {
        const imageUrl = "https://cdn.example.com/profile.jpg?token=rotating-value"

        render(<ProfileAvatar iconSize={24} imageUrl={imageUrl} size={48} />)

        expect(screen.getByTestId("cached-image").props).toMatchObject({
            cachePolicy: "memory-disk",
            recyclingKey: "https://cdn.example.com/profile.jpg",
            source: imageUrl,
        })
    })
})
