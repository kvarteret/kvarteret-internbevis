import { z } from "zod"
import type { RawKvarteretEventDocument } from "@/features/dashboard/domain/types"

const nullableString = z
    .string()
    .nullish()
    .transform(value => value ?? null)
const nullableNumber = z
    .number()
    .nullish()
    .transform(value => value ?? null)
const nullableBoolean = z
    .boolean()
    .nullish()
    .transform(value => value ?? null)

const eventKindSchema = z.enum([
    "single",
    "seriesParent",
    "seriesInstance",
    "festivalParent",
    "festivalSession",
])
const eventStatusSchema = z
    .enum(["scheduled", "cancelled", "postponed"])
    .nullish()
    .transform(value => value ?? null)

const portableTextMarkDefSchema = z.object({
    _key: z.string(),
    _type: z.string(),
    href: z.string().optional(),
    target: z.string().optional(),
})
const portableTextSpanSchema = z.object({
    _key: z.string(),
    _type: z.literal("span"),
    text: z.string(),
    // Sanity omits empty arrays from raw GROQ projections. Normalize that
    // wire representation so domain/rendering code always sees Portable Text.
    marks: z.array(z.string()).default([]),
})
const portableTextBlockSchema = z.object({
    _key: z.string(),
    _type: z.literal("block"),
    style: z.enum(["normal", "h1", "h2", "h3", "h4", "blockquote"]),
    children: z.array(portableTextSpanSchema),
    markDefs: z.array(portableTextMarkDefSchema),
})
const nullableDescriptionSchema = z
    .array(portableTextBlockSchema)
    .nullish()
    .transform(value => value ?? null)

const organizerGroupSchema = z.object({ _id: z.string(), name: z.string(), slug: z.string() })
const taxonomyGroupSchema = z.object({ _id: z.string(), name: z.string(), slug: z.string() })
const eventTypeSchema = z.object({
    _id: z.string(),
    name: z.string(),
    slug: z.string(),
    taxonomyGroup: taxonomyGroupSchema.nullish().transform(value => value ?? null),
})

const inheritableFields = {
    title: nullableString,
    description: nullableDescriptionSchema,
    imageUrl: nullableString,
    imageCaption: nullableString,
    organizerGroup: organizerGroupSchema.nullish().transform(value => value ?? null),
    organizerText: nullableString,
    eventType: eventTypeSchema.nullish().transform(value => value ?? null),
    isFree: nullableBoolean,
    priceOrdinar: nullableNumber,
    priceStudent: nullableNumber,
    priceMedlem: nullableNumber,
    ticketUrl: nullableString,
    facebookUrl: nullableString,
    isInternalEvent: nullableBoolean,
} as const

const eventParentSchema = z.object({
    _id: z.string(),
    slug: z.string(),
    eventKind: eventKindSchema,
    eventStatus: eventStatusSchema,
    ...inheritableFields,
})

const rawEventSchema = z.object({
    _id: z.string(),
    eventKind: eventKindSchema,
    eventStatus: eventStatusSchema,
    parent: eventParentSchema.nullish().transform(value => value ?? null),
    slug: z.string(),
    dates: z.array(
        z.object({
            _key: z.string(),
            startDate: z.string(),
            startTime: nullableString,
            endTime: nullableString,
        }),
    ),
    isRecurring: z.boolean(),
    rrule: nullableString,
    room: z
        .object({ _id: z.string(), name: z.string(), slug: z.string() })
        .nullish()
        .transform(value => value ?? null),
    roomText: nullableString,
    ...inheritableFields,
})

const rawEventsSchema = z.array(rawEventSchema)

export const parseRawEvent = (value: unknown): RawKvarteretEventDocument =>
    rawEventSchema.parse(value)

export const parseRawEvents = (value: unknown): RawKvarteretEventDocument[] =>
    rawEventsSchema.parse(value)
