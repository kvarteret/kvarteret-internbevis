import React from "react"
import { Text as RNText } from "react-native"
import TestRenderer, { act } from "react-test-renderer"
import { MembershipBenefitsCard } from "../MembershipBenefitsCard"

jest.mock("@/shared/ui/Card", () => {
    const React = require("react")
    const { View } = require("react-native")

    return {
        Card: ({ children, ...props }: { children: React.ReactNode }) =>
            React.createElement(View, props, children),
    }
})

jest.mock("@/shared/ui/Text", () => {
    const React = require("react")
    const { Text } = require("react-native")

    return {
        Text: ({ children, ...props }: { children: React.ReactNode }) =>
            React.createElement(Text, props, children),
    }
})

const renderCard = (
    props: Partial<React.ComponentProps<typeof MembershipBenefitsCard>> = {},
): TestRenderer.ReactTestRenderer => {
    let tree: TestRenderer.ReactTestRenderer | null = null

    act(() => {
        tree = TestRenderer.create(
            React.createElement(MembershipBenefitsCard, {
                benefitLabels: ["Gratis te"],
                description: "Description",
                onSelectTier: () => {},
                selectedTier: 1,
                tierLabel: (tier: 1 | 2 | 3) => `Trinn ${tier}`,
                title: "Benefits",
                ...props,
            }),
        )
    })

    return tree as TestRenderer.ReactTestRenderer
}

beforeAll(() => {
    if (typeof window !== "undefined" && typeof window.dispatchEvent !== "function") {
        window.dispatchEvent = jest.fn()
    }
})

describe("MembershipBenefitsCard", () => {
    it("renders nothing when no tier is available", () => {
        const tree = renderCard({
            benefitLabels: [],
            selectedTier: null,
        })

        expect(tree.toJSON()).toBeNull()
    })

    it("renders the selected tier benefits", () => {
        const tree = renderCard({
            benefitLabels: ["Gratis te", "Hansa 0.4"],
        })

        const texts = tree.root
            .findAllByType(RNText)
            .map(node => node.props.children)
            .flat()

        expect(texts).toContain("Benefits")
        expect(texts).toContain("Gratis te")
        expect(texts).toContain("Hansa 0.4")
    })

    it("updates the rendered list when the selected tier changes", () => {
        const tree = renderCard()

        act(() => {
            tree.update(
                React.createElement(MembershipBenefitsCard, {
                    benefitLabels: ["Bulmers"],
                    description: "Description",
                    onSelectTier: () => {},
                    selectedTier: 2,
                    tierLabel: (tier: 1 | 2 | 3) => `Trinn ${tier}`,
                    title: "Benefits",
                }),
            )
        })

        const texts = tree.root
            .findAllByType(RNText)
            .map(node => node.props.children)
            .flat()

        expect(texts).toContain("Bulmers")
        expect(texts).not.toContain("Gratis te")
    })

    it("calls back when another tier is selected", () => {
        const onSelectTier = jest.fn()
        const tree = renderCard({ onSelectTier })

        const button = tree.root.findByProps({ testID: "membership-benefits-tier-2" })

        act(() => {
            button.props.onPress()
        })

        expect(onSelectTier).toHaveBeenCalledWith(2)
    })
})
