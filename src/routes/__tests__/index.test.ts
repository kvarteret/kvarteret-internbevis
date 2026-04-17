import React from "react"
import TestRenderer, { act } from "react-test-renderer"
import IndexRoute from "@/routes/index"

jest.mock("expo-router", () => {
    const React = require("react")
    const { Text } = require("react-native")

    return {
        Redirect: ({ href }: { href: string }) =>
            React.createElement(Text, { testID: "redirect-href" }, href),
    }
})

describe("IndexRoute", () => {
    it("redirects guests to the public Kvarteret tab", () => {
        let tree: TestRenderer.ReactTestRenderer | null = null

        act(() => {
            tree = TestRenderer.create(React.createElement(IndexRoute))
        })

        expect(
            (tree as TestRenderer.ReactTestRenderer).root.findByProps({
                testID: "redirect-href",
            }).props.children,
        ).toBe("/(tabs)/kvarteret")
    })
})
