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
import { VerifyCodeForm } from "../VerifyCodeForm"

const noop = (): void => {}
const noopAsync = async (): Promise<void> => {}

const renderVerifyCodeForm = (
    overrides: Partial<React.ComponentProps<typeof VerifyCodeForm>> = {},
) =>
    render(
        <VerifyCodeForm
            otpCode=""
            otpFieldErrorText={null}
            globalErrorText={null}
            isExpoGo={false}
            onChangeOtpCode={noop}
            onVerifyCode={noopAsync}
            onSendOtp={noopAsync}
            onUseClipboardLink={noopAsync}
            onBack={noop}
            {...overrides}
        />,
    )

describe("VerifyCodeForm", () => {
    it("renders the code input", () => {
        renderVerifyCodeForm()

        expect(screen.getByPlaceholderText("Kode fra epost")).toBeTruthy()
    })

    it("calls onChangeOtpCode as the user types the code", () => {
        const onChangeOtpCode = jest.fn()
        renderVerifyCodeForm({ onChangeOtpCode })

        fireEvent.changeText(screen.getByPlaceholderText("Kode fra epost"), "123456")

        expect(onChangeOtpCode).toHaveBeenCalledWith("123456")
    })

    it("calls onVerifyCode when the confirm button is pressed", () => {
        const onVerifyCode = jest.fn(noopAsync)
        renderVerifyCodeForm({ onVerifyCode })

        fireEvent.press(screen.getByText("Bekreft"))

        expect(onVerifyCode).toHaveBeenCalledTimes(1)
    })

    it("calls onSendOtp when requesting a new code", () => {
        const onSendOtp = jest.fn(noopAsync)
        renderVerifyCodeForm({ onSendOtp })

        fireEvent.press(screen.getByText("Send ny kode"))

        expect(onSendOtp).toHaveBeenCalledTimes(1)
    })

    it("calls onBack when navigating back to email entry", () => {
        const onBack = jest.fn()
        renderVerifyCodeForm({ onBack })

        fireEvent.press(screen.getByText("Tilbake"))

        expect(onBack).toHaveBeenCalledTimes(1)
    })

    it("surfaces a field-level error for an empty or invalid code", () => {
        renderVerifyCodeForm({ otpFieldErrorText: "Vennligst skriv inn engangskoden" })

        expect(screen.getByText("Vennligst skriv inn engangskoden")).toBeTruthy()
    })

    it("surfaces a global error (e.g. an invalid or expired code from the server)", () => {
        renderVerifyCodeForm({ globalErrorText: "Ugyldig eller utløpt kode." })

        expect(screen.getByText("Ugyldig eller utløpt kode.")).toBeTruthy()
    })

    it("does not show the clipboard-link option outside Expo Go", () => {
        renderVerifyCodeForm({ isExpoGo: false })

        expect(screen.queryByText("Bruk lenke fra utklippstavle")).toBeNull()
    })

    it("shows and wires the clipboard-link option inside Expo Go", () => {
        const onUseClipboardLink = jest.fn(noopAsync)
        renderVerifyCodeForm({ isExpoGo: true, onUseClipboardLink })

        fireEvent.press(screen.getByText("Bruk lenke fra utklippstavle"))

        expect(onUseClipboardLink).toHaveBeenCalledTimes(1)
    })
})
