import type {
    EventCalendarMonth,
    EventFeedEntry,
    EventOccurrence,
} from "@/features/dashboard/domain/types"

const FALLBACK_TAXONOMY_GROUP = "Annet"
const OSLO_TIME_ZONE = "Europe/Oslo"
const TAXONOMY_GROUP_ORDER = [
    "eventTaxonomyGroup-faglig",
    "eventTaxonomyGroup-kultur",
    "eventTaxonomyGroup-musikk",
    "eventTaxonomyGroup-sosialt",
]

export interface DerivedEventType {
    _id: string
    name: string
    slug: string
}

export interface DerivedTaxonomyGroup {
    _id: string
    name: string
    eventTypes: DerivedEventType[]
}

export interface DerivedOrganizerGroup {
    _id: string
    name: string
}

export interface DerivedTaxonomy {
    taxonomyGroups: DerivedTaxonomyGroup[]
    organizerGroups: DerivedOrganizerGroup[]
}

export const deriveTaxonomyFromEvents = (occurrences: EventOccurrence[]): DerivedTaxonomy => {
    const groupToTypes = new Map<string, Map<string, DerivedEventType>>()
    const groups = new Map<string, { _id: string; name: string }>()
    const organizers = new Map<string, DerivedOrganizerGroup>()

    for (const { event } of occurrences) {
        if (event.eventType) {
            const group = event.taxonomyGroup ?? {
                id: FALLBACK_TAXONOMY_GROUP,
                name: FALLBACK_TAXONOMY_GROUP,
            }
            groups.set(group.id, { _id: group.id, name: group.name })
            if (!groupToTypes.has(group.id)) groupToTypes.set(group.id, new Map())
            groupToTypes.get(group.id)?.set(event.eventType.id, {
                _id: event.eventType.id,
                name: event.eventType.name,
                slug: event.eventType.id,
            })
        }
        if (event.organizer?.kind === "group") {
            organizers.set(event.organizer.id, {
                _id: event.organizer.id,
                name: event.organizer.name,
            })
        }
    }

    const groupIds = [...groups.keys()].sort((left, right) => {
        const leftIndex = TAXONOMY_GROUP_ORDER.indexOf(left)
        const rightIndex = TAXONOMY_GROUP_ORDER.indexOf(right)
        if (leftIndex === -1 && rightIndex === -1) return 0
        if (leftIndex === -1) return 1
        if (rightIndex === -1) return -1
        return leftIndex - rightIndex
    })

    return {
        taxonomyGroups: groupIds.map(id => ({
            ...(groups.get(id) ?? { _id: id, name: id }),
            eventTypes: [...(groupToTypes.get(id)?.values() ?? [])],
        })),
        organizerGroups: [...organizers.values()],
    }
}

export interface EventFilterState {
    taxonomyGroup: string | null
    eventTypeIds: string[]
    organizerGroupIds: string[]
}

export interface EventFeedSections {
    rest: EventFeedEntry[]
}

export const createEmptyEventFilterState = (): EventFilterState => ({
    eventTypeIds: [],
    organizerGroupIds: [],
    taxonomyGroup: null,
})

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(item => typeof item === "string")

const uniqueStrings = (values: string[]): string[] => [...new Set(values)]

export const parsePersistedEventFilterState = (value: unknown): EventFilterState | null => {
    if (!value || typeof value !== "object") return null
    const candidate = value as Record<string, unknown>
    const taxonomyGroup = candidate.taxonomyGroup
    if (
        taxonomyGroup !== null &&
        taxonomyGroup !== undefined &&
        typeof taxonomyGroup !== "string"
    ) {
        return null
    }
    if (!isStringArray(candidate.eventTypeIds) || !isStringArray(candidate.organizerGroupIds)) {
        return null
    }
    return {
        eventTypeIds: uniqueStrings(candidate.eventTypeIds),
        organizerGroupIds: uniqueStrings(candidate.organizerGroupIds),
        taxonomyGroup: taxonomyGroup?.trim() || null,
    }
}

export const countActiveEventFilters = (filters: EventFilterState): number =>
    (filters.taxonomyGroup ? 1 : 0) + filters.eventTypeIds.length + filters.organizerGroupIds.length

export const getLocalizedTaxonomyGroupName = (groupName: string, _language?: "no" | "en"): string =>
    groupName

export const filterEvents = (
    occurrences: EventOccurrence[],
    filters: EventFilterState,
): EventOccurrence[] => {
    const eventTypeIds = new Set(filters.eventTypeIds)
    const organizerGroupIds = new Set(filters.organizerGroupIds)

    return occurrences.filter(({ event }) => {
        if (filters.taxonomyGroup && event.taxonomyGroup?.id !== filters.taxonomyGroup) return false
        if (eventTypeIds.size > 0 && !eventTypeIds.has(event.eventType?.id ?? "")) return false
        if (
            organizerGroupIds.size > 0 &&
            !organizerGroupIds.has(event.organizer?.kind === "group" ? event.organizer.id : "")
        ) {
            return false
        }
        return true
    })
}

const osloShortDateFormatter = new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "short",
    timeZone: OSLO_TIME_ZONE,
})

export const occurrenceStartDate = (occurrence: EventOccurrence): Date =>
    occurrence.schedule.kind === "timed"
        ? new Date(occurrence.schedule.startsAt)
        : new Date(`${occurrence.schedule.date}T12:00:00Z`)

export const occurrenceDateString = (occurrence: EventOccurrence): string =>
    occurrence.schedule.kind === "date"
        ? occurrence.schedule.date
        : new Intl.DateTimeFormat("en-CA", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              timeZone: OSLO_TIME_ZONE,
          }).format(new Date(occurrence.schedule.startsAt))

export const buildUpcomingDateChips = (occurrences: EventOccurrence[]): string[] => {
    if (occurrences.length === 0) return []
    const chips = occurrences
        .slice(0, 2)
        .map(occurrence => osloShortDateFormatter.format(occurrenceStartDate(occurrence)))
    const remaining = occurrences.length - 2
    if (remaining > 0) chips.push(remaining >= 9 ? "9+" : `+${remaining}`)
    return chips
}

const eventGroupKey = ({ event }: EventOccurrence): string => event.parent?.id ?? event.id

export const buildEventFeedSections = (occurrences: EventOccurrence[]): EventFeedSections => {
    const grouped = new Map<string, EventOccurrence[]>()
    for (const occurrence of occurrences) {
        const key = eventGroupKey(occurrence)
        grouped.set(key, [...(grouped.get(key) ?? []), occurrence])
    }
    return {
        rest: [...grouped.values()].flatMap(occurrencesForEvent => {
            const [occurrence, ...upcomingOccurrences] = occurrencesForEvent
            return occurrence ? [{ occurrence, upcomingOccurrences }] : []
        }),
    }
}

const startOfCurrentWeek = (date: string): string => {
    const [year = 1970, month = 1, day = 1] = date.split("-").map(Number)
    const parsed = new Date(Date.UTC(year, month - 1, day))
    parsed.setUTCDate(parsed.getUTCDate() - ((parsed.getUTCDay() + 6) % 7))
    return parsed.toISOString().slice(0, 10)
}

const nextMonth = (key: string): string => {
    const [year = 1970, month = 1] = key.split("-").map(Number)
    return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, "0")}`
}

export const buildEventCalendarMonths = (
    occurrences: EventOccurrence[],
    today: string,
): EventCalendarMonth[] => {
    const visibleFrom = startOfCurrentWeek(today)
    const visible = occurrences
        .filter(item => occurrenceDateString(item) >= visibleFrom)
        .sort((left, right) => {
            const dateOrder =
                occurrenceStartDate(left).getTime() - occurrenceStartDate(right).getTime()
            return dateOrder || left.id.localeCompare(right.id)
        })
    if (visible.length === 0) return []

    const byDate = new Map<string, EventOccurrence[]>()
    for (const occurrence of visible) {
        const date = occurrenceDateString(occurrence)
        byDate.set(date, [...(byDate.get(date) ?? []), occurrence])
    }

    const lastOccurrence = visible.at(-1)
    if (!lastOccurrence) return []
    const lastDate = occurrenceDateString(lastOccurrence)
    const startMonth = visibleFrom.slice(0, 7)
    const endMonth = lastDate.slice(0, 7)
    const monthKeys: string[] = []
    for (let key = startMonth; key <= endMonth; key = nextMonth(key)) monthKeys.push(key)

    return monthKeys.map(key => {
        const [year = 1970, month = 1] = key.split("-").map(Number)
        const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate()
        const firstDay = key === startMonth ? Number(visibleFrom.slice(8, 10)) : 1
        const days = Array.from({ length: dayCount - firstDay + 1 }, (_, index) => {
            const date = `${key}-${String(firstDay + index).padStart(2, "0")}`
            return { date, occurrences: byDate.get(date) ?? [] }
        })
        return {
            key,
            year,
            month,
            leadingEmptyDays:
                key === startMonth
                    ? 0
                    : (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7,
            days,
            eventCount: days.reduce(
                (count, calendarDay) => count + calendarDay.occurrences.length,
                0,
            ),
        }
    })
}
