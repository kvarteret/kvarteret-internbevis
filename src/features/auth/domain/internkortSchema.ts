import { z } from "zod"
import { InternKortVerv, InternKortVervHistorikk, User } from "@/shared/types/user"

const nullableStringSchema = z.string().nullable().optional()
const nullableIntSchema = z.number().int().nullable().optional()
const nullableDateTimeSchema = z.string().min(1).nullable().optional()

function isValidDateTime(value: string): boolean {
    const date = new Date(value)
    return !Number.isNaN(date.getTime())
}

function parseOptionalDate(value: string | null | undefined): Date | null {
    if (!value) {
        return null
    }

    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) {
        return null
    }

    return parsedDate
}

export const mobileCardSessionRequestSchema = z
    .object({
        email: nullableStringSchema,
        accessCode: nullableStringSchema,
    })
    .strict()

export const mobileCardRoleApiSchema = z
    .object({
        name: nullableStringSchema,
        group: nullableStringSchema,
        discount_level: nullableIntSchema,
        pingvin_points: z.number().int().optional(),
        signed_contract: z.boolean().optional(),
    })
    .passthrough()

const nullableStringOrNumberSchema = z.union([z.string(), z.number()]).nullable().optional()

export const mobileCardRoleHistoryApiSchema = z
    .object({
        name: nullableStringSchema,
        role_name: nullableStringSchema,
        group: nullableStringSchema,
        group_name: nullableStringSchema,
        discount_level: nullableIntSchema,
        pingvin_points: z.number().int().optional(),
        signed_contract: z.boolean().optional(),
        contract_signed: z.boolean().optional(),
        start_date: nullableStringSchema,
        started_at: nullableStringSchema,
        end_date: nullableStringSchema,
        ended_at: nullableStringSchema,
        year: nullableIntSchema,
        term: nullableStringOrNumberSchema,
        semester: nullableStringOrNumberSchema,
        is_active: z.boolean().optional(),
        active: z.boolean().optional(),
    })
    .passthrough()

export const mobileCardResponseApiSchema = z
    .object({
        person_id: z.number().int(),
        first_name: nullableStringSchema,
        last_name: nullableStringSchema,
        birth_date: nullableDateTimeSchema,
        created_at: z
            .string()
            .min(1)
            .refine(value => isValidDateTime(value), {
                message: "created_at must be a valid date-time string",
            }),
        valid_until: z
            .string()
            .min(1)
            .refine(value => isValidDateTime(value), {
                message: "valid_until must be a valid date-time string",
            }),
        photo_url: nullableStringSchema,
        pingvin_points: z.number().int(),
        active_roles: z.array(mobileCardRoleApiSchema).nullable().optional(),
        role_history: z.array(mobileCardRoleHistoryApiSchema).nullable().optional(),
        word_of_the_day: nullableStringSchema,
    })
    .passthrough()

export const mobileCardSessionApiSchema = z
    .object({
        session_token: z.string().min(1),
        card: mobileCardResponseApiSchema,
    })
    .passthrough()

function mapMobileCardRole(value: z.infer<typeof mobileCardRoleApiSchema>): InternKortVerv {
    return {
        navn: value.name ?? "",
        gruppe: value.group ?? "",
        rabattTrinn: value.discount_level ?? null,
        pingvinPoeng: value.pingvin_points ?? 0,
        signertKontrakt: value.signed_contract ?? false,
    }
}

const normalizeStringOrNumber = (value: string | number | null | undefined): string | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return String(value)
    }

    const trimmed = typeof value === "string" ? value.trim() : ""
    return trimmed && trimmed.length > 0 ? trimmed : null
}

function mapMobileCardRoleHistory(
    value: z.infer<typeof mobileCardRoleHistoryApiSchema>,
): InternKortVervHistorikk {
    return {
        navn: value.name ?? value.role_name ?? "",
        gruppe: value.group ?? value.group_name ?? "",
        rabattTrinn: value.discount_level ?? null,
        pingvinPoeng: value.pingvin_points ?? 0,
        signertKontrakt: value.signed_contract ?? value.contract_signed ?? false,
        startet: value.start_date ?? value.started_at ?? null,
        sluttet: value.end_date ?? value.ended_at ?? null,
        ar: value.year ?? null,
        semester: normalizeStringOrNumber(value.semester ?? value.term),
        aktiv: value.is_active ?? value.active ?? false,
    }
}

export function parseInternkortInformation(payload: unknown): User {
    const parsed = mobileCardResponseApiSchema.parse(payload)

    return {
        id: parsed.person_id,
        fornavn: parsed.first_name ?? "",
        etternavn: parsed.last_name ?? "",
        fodselsdato: parseOptionalDate(parsed.birth_date),
        opprettet: parseOptionalDate(parsed.created_at),
        gyldigTil: new Date(parsed.valid_until),
        bildeUrl: parsed.photo_url ?? undefined,
        pingvinPoengSum: parsed.pingvin_points,
        aktiveVerv: (parsed.active_roles ?? []).map(mapMobileCardRole),
        vervHistorikk: (parsed.role_history ?? []).map(mapMobileCardRoleHistory),
        dagensOrd: parsed.word_of_the_day ?? "",
    }
}

export function parseMobileCardSession(payload: unknown): {
    sessionToken: string
    user: User
} {
    const parsed = mobileCardSessionApiSchema.parse(payload)
    return {
        sessionToken: parsed.session_token,
        user: parseInternkortInformation(parsed.card),
    }
}
