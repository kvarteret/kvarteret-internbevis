jest.mock("@tanstack/react-query", () => ({
    useQuery: jest.fn(),
}))
jest.mock("@expo/vector-icons", () => ({
    MaterialIcons: () => null,
}))
jest.mock("expo-router", () => ({
    useNavigation: () => ({ setOptions: jest.fn() }),
}))
jest.mock("@/app/providers/SessionProvider", () => ({
    useSession: jest.fn(),
}))
jest.mock("@/shared/theme/use-theme-runtime-colors", () => ({
    useThemeRuntimeColors: () => ({
        textPrimary: "#111827",
        textSecondary: "#6b7280",
        editorialValid: "#16a34a",
    }),
}))

import { useQuery } from "@tanstack/react-query"
import { fireEvent, render, screen } from "@testing-library/react-native"
import { useSession } from "@/app/providers/SessionProvider"
import { BenefitsScreen } from "../BenefitsScreen"

const mockUseQuery = useQuery as jest.Mock
const mockUseSession = useSession as jest.Mock

const createUser = (rabattTrinn: number | null) => ({
    id: 1,
    fornavn: "Test",
    etternavn: "Bruker",
    fodselsdato: null,
    opprettet: null,
    gyldigTil: new Date("2027-01-01"),
    pingvinPoengSum: 0,
    aktiveVerv:
        rabattTrinn === null
            ? []
            : [
                  {
                      navn: "Medlem",
                      gruppe: "Testgruppe",
                      signertKontrakt: true,
                      rabattTrinn,
                      pingvinPoeng: 1,
                  },
              ],
    vervHistorikk: [],
    dagensOrd: "",
})

describe("BenefitsScreen", () => {
    beforeEach(() => {
        mockUseSession.mockReturnValue({ user: createUser(2), isAnonymous: false })
    })

    it("shows a loading indicator while pending", () => {
        mockUseQuery.mockReturnValue({
            data: undefined,
            isPending: true,
            isError: false,
            refetch: jest.fn(),
        })

        render(<BenefitsScreen />)

        expect(screen.getByRole("progressbar")).toBeTruthy()
    })

    it("shows a retry option on error", () => {
        const refetch = jest.fn()
        mockUseQuery.mockReturnValue({
            data: undefined,
            isPending: false,
            isError: true,
            refetch,
        })

        render(<BenefitsScreen />)

        expect(screen.getByText("Kunne ikke hente fordelene.")).toBeTruthy()
        fireEvent.press(screen.getByText("Prøv igjen"))
        expect(refetch).toHaveBeenCalledTimes(1)
    })

    it("shows the empty state when no benefits apply to the selected tier", () => {
        mockUseQuery.mockReturnValue({
            data: [],
            isPending: false,
            isError: false,
            refetch: jest.fn(),
        })

        render(<BenefitsScreen />)

        expect(screen.getByText("Ingen fordeler registrert for dette trinnet.")).toBeTruthy()
    })

    it("renders fetched benefits for the user's tier", () => {
        mockUseQuery.mockReturnValue({
            data: [
                {
                    id: "b1",
                    name: "Gratis kaffe",
                    description: "Så mye du vil",
                    minimumTier: "trinn1",
                },
                {
                    id: "b2",
                    name: "Trinn 2-only fordel",
                    description: null,
                    minimumTier: "trinn2",
                },
            ],
            isPending: false,
            isError: false,
            refetch: jest.fn(),
        })

        render(<BenefitsScreen />)

        expect(screen.getByText("Gratis kaffe")).toBeTruthy()
        expect(screen.getByText("Trinn 2-only fordel")).toBeTruthy()
    })

    it("hides tiers above the user's own tier", () => {
        mockUseSession.mockReturnValue({ user: createUser(1), isAnonymous: false })
        mockUseQuery.mockReturnValue({
            data: [],
            isPending: false,
            isError: false,
            refetch: jest.fn(),
        })

        render(<BenefitsScreen />)

        expect(screen.getByText("Trinn 1")).toBeTruthy()
        expect(screen.queryByText("Trinn 3")).toBeNull()
    })

    it("renders a tier tab selector for an anonymous user (tier 0 shows only trinn 1)", () => {
        mockUseSession.mockReturnValue({ user: null, isAnonymous: true })
        mockUseQuery.mockReturnValue({
            data: [],
            isPending: false,
            isError: false,
            refetch: jest.fn(),
        })

        render(<BenefitsScreen />)

        expect(screen.getByText("Trinn 1")).toBeTruthy()
        expect(screen.queryByText("Trinn 2")).toBeNull()
    })
})
