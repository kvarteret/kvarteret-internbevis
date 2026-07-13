jest.mock("@/core/storage/asyncStorage", () => ({
    getStoredValue: jest.fn(),
    setStoredValue: jest.fn(),
}))
jest.mock("@/app/localization/i18n", () => ({
    changeLanguage: jest.fn(),
}))

import { resolveHydratedLanguage } from "../LanguageProvider"

describe("resolveHydratedLanguage", () => {
    it("uses the device language on first launch (nothing stored)", () => {
        expect(resolveHydratedLanguage(null, "en")).toBe("en")
        expect(resolveHydratedLanguage(null, "no")).toBe("no")
    })

    it("uses the device language when the stored value is unrecognized", () => {
        expect(resolveHydratedLanguage("fr", "en")).toBe("en")
        expect(resolveHydratedLanguage("", "en")).toBe("en")
    })

    it("uses the stored value when it is a recognized language, even if it differs from the device", () => {
        expect(resolveHydratedLanguage("no", "en")).toBe("no")
        expect(resolveHydratedLanguage("en", "no")).toBe("en")
    })
})
