import { User } from "@/shared/types/user"

export const ANALYTICS_EVENT = {
    aboutExternalLinkClicked: "about_external_link_clicked",
    authClipboardLinkUsed: "auth_clipboard_link_used",
    authCodeRequestFailed: "auth_code_request_failed",
    authCodeRequested: "auth_code_requested",
    authContinueAnonymous: "auth_continue_anonymous",
    authDeeplinkLoginFailed: "auth_deeplink_login_failed",
    authDeeplinkLoginSucceeded: "auth_deeplink_login_succeeded",
    authLoginFailed: "auth_login_failed",
    authLoginSucceeded: "auth_login_succeeded",
    eventFacebookCtaClicked: "event_facebook_cta_clicked",
    eventOpened: "event_opened",
    eventTicketCtaClicked: "event_ticket_cta_clicked",
    feedbackSubmitted: "feedback_submitted",
    feedbackSubmitFailed: "feedback_submit_failed",
    gamesChessTimerCompleted: "games_chess_timer_completed",
    gamesChessTimerStarted: "games_chess_timer_started",
    gamesDiceRolled: "games_dice_rolled",
    menuItemClicked: "menu_item_clicked",
    profileRolesUpdated: "profile_roles_updated",
    volunteerCtaClicked: "volunteer_cta_clicked",
} as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENT)[keyof typeof ANALYTICS_EVENT]
export type AnalyticsAuthState = "anonymous" | "identified" | "signed_out"
export type AnalyticsAppArea =
    | "about"
    | "auth"
    | "events"
    | "feedback"
    | "games"
    | "kvarteret"
    | "kontroll"
    | "privacy"
    | "profile"
    | "system"
export type AnalyticsFunnelArea = "account" | "events" | "feedback" | "volunteer"
export type LoginMethod = "clipboard" | "deeplink" | "otp"

export interface AnalyticsDefaultProperties {
    app_area: AnalyticsAppArea
    auth_state: AnalyticsAuthState
    language: string
    platform: string
    product: "kvarteret"
    surface: "mobile_app"
}

interface AuthBaseEventProperties {
    funnel_area: "account"
    login_method: LoginMethod | "email"
}

interface ExternalLinkEventProperties {
    destination_host: string | null
    destination_type: string
    destination_url: string
}

export interface AnalyticsEventProperties {
    [ANALYTICS_EVENT.aboutExternalLinkClicked]: ExternalLinkEventProperties & {
        funnel_area?: "volunteer"
        link_location: "about_card"
    }
    [ANALYTICS_EVENT.authClipboardLinkUsed]: {
        funnel_area: "account"
        has_token: boolean
    }
    [ANALYTICS_EVENT.authCodeRequestFailed]: AuthBaseEventProperties & {
        request_source: "initial" | "resend"
    }
    [ANALYTICS_EVENT.authCodeRequested]: AuthBaseEventProperties & {
        request_source: "initial" | "resend"
    }
    [ANALYTICS_EVENT.authContinueAnonymous]: {
        funnel_area: "account"
    }
    [ANALYTICS_EVENT.authDeeplinkLoginFailed]: AuthBaseEventProperties
    [ANALYTICS_EVENT.authDeeplinkLoginSucceeded]: AuthBaseEventProperties
    [ANALYTICS_EVENT.authLoginFailed]: AuthBaseEventProperties
    [ANALYTICS_EVENT.authLoginSucceeded]: AuthBaseEventProperties
    [ANALYTICS_EVENT.eventFacebookCtaClicked]: ExternalLinkEventProperties & {
        event_id: string
        event_title: string
        event_type_slug: string | null
        funnel_area: "events"
        is_featured: boolean
        visibility: "internal" | "public"
    }
    [ANALYTICS_EVENT.eventOpened]: {
        event_id: string
        event_title: string
        event_type_slug: string | null
        funnel_area: "events"
        is_featured: boolean
        organizer_group_slugs: string[]
        visibility: "internal" | "public"
    }
    [ANALYTICS_EVENT.eventTicketCtaClicked]: ExternalLinkEventProperties & {
        event_id: string
        event_title: string
        event_type_slug: string | null
        funnel_area: "events"
        is_featured: boolean
        visibility: "internal" | "public"
    }
    [ANALYTICS_EVENT.feedbackSubmitted]: {
        contact_allowed: boolean
        funnel_area: "feedback"
        has_contact_email: boolean
        is_logged_in: boolean
    }
    [ANALYTICS_EVENT.feedbackSubmitFailed]: {
        contact_allowed: boolean
        funnel_area: "feedback"
        has_contact_email: boolean
        is_logged_in: boolean
    }
    [ANALYTICS_EVENT.gamesChessTimerCompleted]: {
        active_player: "black" | "white"
        funnel_area?: "events"
        increment_seconds: number
        initial_minutes_per_side: number
        move_count: number
        preset: string
        winner: "black" | "white"
    }
    [ANALYTICS_EVENT.gamesChessTimerStarted]: {
        active_player: "black" | "white"
        funnel_area?: "events"
        increment_seconds: number
        initial_minutes_per_side: number
        preset: string
    }
    [ANALYTICS_EVENT.gamesDiceRolled]: {
        dice_roll_count: number
        dice_type: number
        result: number
    }
    [ANALYTICS_EVENT.menuItemClicked]: {
        destination: string
        menu_item_id: string
    }
    [ANALYTICS_EVENT.profileRolesUpdated]: {
        primary_role_group: string | null
        primary_role_name: string | null
        role_groups: string[]
        role_names: string[]
        role_selection_count: number
    }
    [ANALYTICS_EVENT.volunteerCtaClicked]: ExternalLinkEventProperties & {
        funnel_area: "volunteer"
        link_location: "footer"
    }
}

const DEFAULT_EXTERNAL_HOST = "unknown"
const URL_SCHEME_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/

export const resolveAnalyticsAppArea = (pathname: string | null | undefined): AnalyticsAppArea => {
    if (!pathname) {
        return "system"
    }

    if (pathname.startsWith("/about")) {
        return "about"
    }

    if (pathname.startsWith("/event/")) {
        return "events"
    }

    if (pathname.startsWith("/feedback")) {
        return "feedback"
    }

    if (pathname.startsWith("/games") || pathname.startsWith("/chess-time-control")) {
        return "games"
    }

    if (pathname.startsWith("/login")) {
        return "auth"
    }

    if (pathname.startsWith("/privacy") || pathname.startsWith("/settings")) {
        return "privacy"
    }

    if (pathname.startsWith("/profile-roles")) {
        return "profile"
    }

    if (pathname.startsWith("/kvarteret")) {
        return "kvarteret"
    }

    if (pathname.startsWith("/kontroll") || pathname === "/") {
        return "kontroll"
    }

    return "system"
}

export const buildAnalyticsDefaultProperties = ({
    hasUser,
    isAnonymous,
    language,
    pathname,
    platform,
}: {
    hasUser: boolean
    isAnonymous: boolean
    language: string
    pathname: string | null | undefined
    platform: string
}): AnalyticsDefaultProperties => ({
    surface: "mobile_app",
    product: "kvarteret",
    app_area: resolveAnalyticsAppArea(pathname),
    auth_state: hasUser ? "identified" : isAnonymous ? "anonymous" : "signed_out",
    platform,
    language,
})

export const buildPostHogPersonProperties = (
    user: User,
): Record<string, number | string | string[]> => ({
    active_role_count: user.aktiveVerv.length,
    active_role_groups: user.aktiveVerv.map(role => role.gruppe),
    active_role_names: user.aktiveVerv.map(role => role.navn),
    first_name: user.fornavn,
    full_name: `${user.fornavn} ${user.etternavn}`.trim(),
    last_name: user.etternavn,
    membership_valid_until: user.gyldigTil.toISOString(),
    pingvin_points_sum: user.pingvinPoengSum,
    user_id: user.id,
})

export const getAnalyticsDestinationHost = (value: string): string | null => {
    const trimmed = value.trim()
    if (!trimmed) {
        return null
    }

    try {
        const normalizedValue = URL_SCHEME_PATTERN.test(trimmed) ? trimmed : `https://${trimmed}`
        const url = new URL(normalizedValue)

        if (url.protocol === "mailto:") {
            const domain = url.pathname.split("@")[1]?.trim()
            return domain || DEFAULT_EXTERNAL_HOST
        }

        return url.host || DEFAULT_EXTERNAL_HOST
    } catch {
        return DEFAULT_EXTERNAL_HOST
    }
}
