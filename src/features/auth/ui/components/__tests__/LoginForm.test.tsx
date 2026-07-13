jest.mock("@expo/vector-icons", () => ({
    MaterialIcons: () => null,
}))
jest.mock("@/shared/theme/use-theme-runtime-colors", () => ({
    useThemeRuntimeColors: () => ({
        androidActionSurface: "#ffffff",
        androidCardElevatedSurface: "#ffffff",
        androidCardGroupedSurface: "#ffffff",
        androidHeaderSurface: "#ffffff",
        androidSurfaceOutline: "#111827",
        background: "#ffffff",
        brandPrimary: "#ffffff",
        editorialInk: "#111827",
        editorialValid: "#16a34a",
        link: "#2563eb",
        stateDanger: "#dc2626",
        surface: "#ffffff",
        surfaceMuted: "#f3f4f6",
        tabActive: "#111827",
        textPrimary: "#111827",
        textSecondary: "#6b7280",
    }),
}))

import { fireEvent, render, screen } from "@testing-library/react-native"
import type React from "react"
import { LoginForm } from "../LoginForm"

const noop = (): void => {}
const noopAsync = async (): Promise<void> => {}

const renderLoginForm = (overrides: Partial<React.ComponentProps<typeof LoginForm>> = {}) =>
    render(
        <LoginForm
            email=""
            emailErrorText={null}
            privacyPolicyChecked={false}
            sendingOtp={false}
            onChangeEmail={noop}
            onTogglePrivacy={noop}
            onPrivacyPress={noop}
            onSubmitEmail={noopAsync}
            onDemoLogin={noop}
            onContinueAnonymous={noop}
            showDemoButton={false}
            {...overrides}
        />,
    )

describe("LoginForm", () => {
    it("renders the email input and privacy consent", () => {
        renderLoginForm()

        expect(screen.getByPlaceholderText("reodor@kvarteret.no")).toBeTruthy()
        expect(screen.getByText("Jeg godtar personvernerklæringen")).toBeTruthy()
    })

    it("calls onChangeEmail as the user types", () => {
        const onChangeEmail = jest.fn()
        renderLoginForm({ onChangeEmail })

        fireEvent.changeText(
            screen.getByPlaceholderText("reodor@kvarteret.no"),
            "person@kvarteret.no",
        )

        expect(onChangeEmail).toHaveBeenCalledWith("person@kvarteret.no")
    })

    it("calls onTogglePrivacy when the consent checkbox is pressed", () => {
        const onTogglePrivacy = jest.fn()
        renderLoginForm({ onTogglePrivacy })

        fireEvent.press(screen.getByRole("checkbox"))

        expect(onTogglePrivacy).toHaveBeenCalledTimes(1)
    })

    it("shows the checkbox as checked once privacy is accepted", () => {
        renderLoginForm({ privacyPolicyChecked: true })

        expect(screen.getByRole("checkbox").props.accessibilityState.checked).toBe(true)
    })

    it("surfaces an email validation error", () => {
        renderLoginForm({ emailErrorText: "Skriv inn en gyldig e-postadresse." })

        expect(screen.getByText("Skriv inn en gyldig e-postadresse.")).toBeTruthy()
    })

    it("does not render the demo button unless showDemoButton is set", () => {
        renderLoginForm({ showDemoButton: false })

        expect(screen.queryByText("Prøv demo")).toBeNull()
    })

    it("renders and triggers the demo button when showDemoButton is set", () => {
        const onDemoLogin = jest.fn()
        renderLoginForm({ showDemoButton: true, onDemoLogin })

        fireEvent.press(screen.getByText("Prøv demo"))

        expect(onDemoLogin).toHaveBeenCalledTimes(1)
    })

    it("calls onContinueAnonymous when the guest button is pressed", () => {
        const onContinueAnonymous = jest.fn()
        renderLoginForm({ onContinueAnonymous })

        fireEvent.press(screen.getByText("Fortsett som gjest"))

        expect(onContinueAnonymous).toHaveBeenCalledTimes(1)
    })
})
