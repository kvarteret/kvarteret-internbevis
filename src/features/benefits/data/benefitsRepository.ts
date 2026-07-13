import { z } from "zod"
import { sanityFetch } from "@/core/sanity/client"

export const BENEFIT_TIERS = ["trinn1", "trinn2", "trinn3"] as const

const benefitSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z
        .string()
        .nullish()
        .transform(value => value ?? ""),
    minimumTier: z.enum(BENEFIT_TIERS),
})

const benefitsResponseSchema = z.array(benefitSchema)

export type BenefitTier = (typeof BENEFIT_TIERS)[number]
export type Benefit = z.infer<typeof benefitSchema>

const BENEFITS_QUERY = `*[_type == "internbevisBenefit"] | order(minimumTier asc, name asc) {
    "id": _id,
    name,
    description,
    minimumTier
}`

export const fetchBenefits = async (signal?: AbortSignal): Promise<Benefit[]> => {
    const payload = await sanityFetch<unknown>(BENEFITS_QUERY, { signal })
    return benefitsResponseSchema.parse(payload)
}
