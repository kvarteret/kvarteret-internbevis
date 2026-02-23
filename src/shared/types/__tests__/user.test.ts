import {
  User,
  getHighestTier,
  getHighestTierGroup,
  getHighestTierName,
} from "../user";

const createUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  fornavn: "Test",
  etternavn: "User",
  fodselsdato: null,
  opprettet: null,
  gyldigTil: new Date("2026-01-01T00:00:00.000Z"),
  bildeUrl: undefined,
  pingvinPoengSum: 0,
  aktiveVerv: [],
  dagensOrd: "ord",
  ...overrides,
});

describe("user tier helpers", () => {
  it("keeps non-pingvin users on highest active role", () => {
    const user = createUser({
      pingvinPoengSum: 5,
      aktiveVerv: [
        {
          navn: "Medlem",
          gruppe: "PR-Etaten",
          signertKontrakt: true,
          rabattTrinn: 2,
        },
      ],
    });

    expect(getHighestTier(user)).toBe(2);
    expect(getHighestTierName(user)).toBe("Medlem");
  });

  it("always gives pingvin users tier 3 or higher in status tier output", () => {
    const user = createUser({
      pingvinPoengSum: 14,
      aktiveVerv: [
        {
          navn: "Lavt Trinn",
          gruppe: "Testgruppe",
          signertKontrakt: true,
          rabattTrinn: 1,
        },
      ],
    });

    expect(getHighestTier(user)).toBeGreaterThanOrEqual(3);
    expect(getHighestTier(user)).toBe(3);
  });

  it("resolves pingvin as highest group/name for pingvin users", () => {
    const user = createUser({
      pingvinPoengSum: 20,
      aktiveVerv: [
        {
          navn: "Utvikler",
          gruppe: "E-Tjenesten",
          signertKontrakt: true,
          rabattTrinn: 2,
        },
      ],
    });

    expect(getHighestTierName(user)).toBe("Pingvin");
    expect(getHighestTierGroup(user)).toBe("Pingvin Ordenen");
  });
});
