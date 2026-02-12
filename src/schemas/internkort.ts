import { z } from "zod"
import { InternKortVerv, User } from "../types/user"

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

export const digitalInternKortRequestSchema = z
    .object({
        email: nullableStringSchema,
        accessToken: nullableStringSchema,
    })
    .strict()

export const internKortVervApiSchema = z
    .object({
        navn: nullableStringSchema,
        gruppe: nullableStringSchema,
        rabattTrinn: nullableIntSchema,
        signertKontrakt: z.boolean().optional(),
    })
    .strict()

export const internKortInformationApiSchema = z
    .object({
        id: z.number().int(),
        fornavn: nullableStringSchema,
        etternavn: nullableStringSchema,
        fodselsdato: nullableDateTimeSchema,
        opprettet: nullableDateTimeSchema,
        gyldigTil: z
            .string()
            .min(1)
            .refine(value => isValidDateTime(value), {
                message: "gyldigTil must be a valid date-time string",
            }),
        bildeUrl: nullableStringSchema,
        pingvinPoengSum: z.number().int(),
        aktiveVerv: z.array(internKortVervApiSchema).nullable().optional(),
        dagensOrd: nullableStringSchema,
    })
    .strict()

function mapInternKortVerv(value: z.infer<typeof internKortVervApiSchema>): InternKortVerv {
    return {
        navn: value.navn ?? "",
        gruppe: value.gruppe ?? "",
        rabattTrinn: value.rabattTrinn ?? null,
        signertKontrakt: value.signertKontrakt ?? false,
    }
}

export function parseInternkortInformation(payload: unknown): User {
    const parsed = internKortInformationApiSchema.parse(payload)

    return {
        id: parsed.id,
        fornavn: parsed.fornavn ?? "",
        etternavn: parsed.etternavn ?? "",
        fodselsdato: parseOptionalDate(parsed.fodselsdato),
        opprettet: parseOptionalDate(parsed.opprettet),
        gyldigTil: new Date(parsed.gyldigTil),
        bildeUrl: parsed.bildeUrl ?? undefined,
        pingvinPoengSum: parsed.pingvinPoengSum,
        aktiveVerv: (parsed.aktiveVerv ?? []).map(mapInternKortVerv),
        dagensOrd: parsed.dagensOrd ?? "",
    }
}
