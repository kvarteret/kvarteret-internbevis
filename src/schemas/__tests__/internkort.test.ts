import { parseInternkortInformation } from "../internkort";

describe("parseInternkortInformation", () => {
  it("parses a valid response payload", () => {
    const user = parseInternkortInformation({
      id: 123,
      fornavn: "Ada",
      etternavn: "Lovelace",
      fodselsdato: "1990-01-02T00:00:00Z",
      opprettet: "2025-01-01T00:00:00Z",
      gyldigTil: "2026-01-01T00:00:00Z",
      bildeUrl: "https://example.com/image.jpg",
      pingvinPoengSum: 10,
      aktiveVerv: [
        {
          navn: "Medlem",
          gruppe: "PR-Etaten",
          rabattTrinn: 2,
          signertKontrakt: true,
        },
      ],
      dagensOrd: "eplepingvin",
    });

    expect(user.id).toBe(123);
    expect(user.fornavn).toBe("Ada");
    expect(user.gyldigTil).toBeInstanceOf(Date);
    expect(user.aktiveVerv).toHaveLength(1);
  });

  it("throws when required strict fields are missing", () => {
    expect(() =>
      parseInternkortInformation({
        fornavn: "Ada",
        gyldigTil: "2026-01-01T00:00:00Z",
      }),
    ).toThrow();
  });

  it("defaults optional nullable fields safely", () => {
    const user = parseInternkortInformation({
      id: 1,
      fornavn: null,
      etternavn: null,
      fodselsdato: null,
      opprettet: null,
      gyldigTil: "2026-01-01T00:00:00Z",
      bildeUrl: null,
      pingvinPoengSum: 0,
      aktiveVerv: null,
      dagensOrd: null,
    });

    expect(user.fornavn).toBe("");
    expect(user.etternavn).toBe("");
    expect(user.fodselsdato).toBeNull();
    expect(user.aktiveVerv).toEqual([]);
    expect(user.dagensOrd).toBe("");
  });

  it("falls back to null for invalid optional date fields", () => {
    const user = parseInternkortInformation({
      id: 2,
      gyldigTil: "2026-01-01T00:00:00Z",
      pingvinPoengSum: 4,
      fodselsdato: "not-a-date",
      opprettet: "also-not-a-date",
      aktiveVerv: [],
    });

    expect(user.fodselsdato).toBeNull();
    expect(user.opprettet).toBeNull();
  });
});
