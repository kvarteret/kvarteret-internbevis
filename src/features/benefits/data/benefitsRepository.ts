import { sanityFetch } from "@/core/sanity/client"

export type BenefitTier = "trinn1" | "trinn2" | "trinn3"

export interface Benefit {
    id: string
    name: string
    description: string
    minimumTier: BenefitTier
}

const BENEFITS_QUERY = `*[_type == "internbevisBenefit"] | order(minimumTier asc, name asc) {
    "id": _id,
    name,
    description,
    minimumTier
}`

export const fetchBenefits = async (signal?: AbortSignal): Promise<Benefit[]> =>
    sanityFetch<Benefit[]>(BENEFITS_QUERY, { signal })
