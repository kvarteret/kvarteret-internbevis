import type { PublicEventsResponse } from "@/core/api/samfunnet-events"

export type EventOccurrence = PublicEventsResponse["data"][number]
export type PublicEvent = EventOccurrence["event"]
export type EventSchedule = EventOccurrence["schedule"]

export interface EventFeedEntry {
    occurrence: EventOccurrence
    upcomingOccurrences: EventOccurrence[]
}

export interface EventCalendarDay {
    date: string
    occurrences: EventOccurrence[]
}

export interface EventCalendarMonth {
    key: string
    year: number
    month: number
    leadingEmptyDays: number
    days: EventCalendarDay[]
    eventCount: number
}
