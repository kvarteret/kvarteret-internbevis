import { parseInternkortInformation, parseMobileCardSession } from "../internkortSchema"

describe("parseInternkortInformation", () => {
    it("parses a valid response payload", () => {
        const user = parseInternkortInformation({
            person_id: 123,
            first_name: "Ada",
            last_name: "Lovelace",
            birth_date: "1990-01-02",
            created_at: "2025-01-01T00:00:00Z",
            valid_until: "2026-01-01T00:00:00Z",
            photo_url: "https://example.com/image.jpg",
            pingvin_points: 10,
            active_roles: [
                {
                    name: "Medlem",
                    group: "PR-Etaten",
                    discount_level: 2,
                    pingvin_points: 8,
                    signed_contract: true,
                },
            ],
            word_of_the_day: "eplepingvin",
        })

        expect(user.id).toBe(123)
        expect(user.fornavn).toBe("Ada")
        expect(user.gyldigTil).toBeInstanceOf(Date)
        expect(user.aktiveVerv).toHaveLength(1)
        expect(user.aktiveVerv[0]?.pingvinPoeng).toBe(8)
    })

    it("throws when required strict fields are missing", () => {
        expect(() =>
            parseInternkortInformation({
                first_name: "Ada",
                valid_until: "2026-01-01T00:00:00Z",
            }),
        ).toThrow()
    })

    it("defaults optional nullable fields safely", () => {
        const user = parseInternkortInformation({
            person_id: 1,
            first_name: null,
            last_name: null,
            birth_date: null,
            created_at: "2025-01-01T00:00:00Z",
            valid_until: "2026-01-01T00:00:00Z",
            photo_url: null,
            pingvin_points: 0,
            active_roles: null,
            word_of_the_day: null,
        })

        expect(user.fornavn).toBe("")
        expect(user.etternavn).toBe("")
        expect(user.fodselsdato).toBeNull()
        expect(user.aktiveVerv).toEqual([])
        expect(user.dagensOrd).toBe("")
    })

    it("defaults missing pingvinPoeng on roles to zero for rollout compatibility", () => {
        const user = parseInternkortInformation({
            person_id: 9,
            first_name: "Ada",
            last_name: "Lovelace",
            created_at: "2025-01-01T00:00:00Z",
            valid_until: "2026-01-01T00:00:00Z",
            pingvin_points: 3,
            active_roles: [
                {
                    name: "Medlem",
                    group: "PR-Etaten",
                    discount_level: 1,
                    signed_contract: true,
                },
            ],
        })

        expect(user.aktiveVerv[0]?.pingvinPoeng).toBe(0)
    })

    it("falls back to null for invalid optional date fields", () => {
        const user = parseInternkortInformation({
            person_id: 2,
            created_at: "2025-01-01T00:00:00Z",
            valid_until: "2026-01-01T00:00:00Z",
            pingvin_points: 4,
            birth_date: "not-a-date",
            active_roles: [],
        })

        expect(user.fodselsdato).toBeNull()
    })

    it("parses a session response and extracts the bearer token", () => {
        const session = parseMobileCardSession({
            session_token: "session-123",
            card: {
                person_id: 2,
                first_name: "Ada",
                last_name: "Lovelace",
                birth_date: "1990-01-02",
                created_at: "2025-01-01T00:00:00Z",
                valid_until: "2026-01-01T00:00:00Z",
                photo_url: "https://example.com/image.jpg",
                pingvin_points: 4,
                active_roles: [],
                word_of_the_day: "pingvin",
            },
        })

        expect(session.sessionToken).toBe("session-123")
        expect(session.user.id).toBe(2)
    })
})
