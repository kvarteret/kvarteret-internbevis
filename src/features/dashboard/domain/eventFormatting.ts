import { format } from "date-fns"
import { enUS, nb } from "date-fns/locale"
import { FirestoreEventDocument } from "@/features/dashboard/domain/types"

export const formatEventDateTime = (date: Date, language: "no" | "en"): string =>
    format(date, "PPp", { locale: language === "en" ? enUS : nb })

export const formatEventStart = (date: Date): string =>
    new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date)

export const getEventCategoriesText = (event: FirestoreEventDocument): string =>
    event.categories.map(category => category.name).join(", ")

export const selectPrimaryDetailsHtml = (
    translation: FirestoreEventDocument["translations"]["no"] | FirestoreEventDocument["translations"]["en"],
): string => {
    const description = translation?.description?.trim() ?? ""
    if (description.length > 0) {
        return description
    }

    return translation?.content?.trim() ?? ""
}
