import Constants from "expo-constants"
import * as Updates from "expo-updates"
import { Platform } from "react-native"
import { appEnv } from "@/app/config/env"
import {
    buildSessionLogoutDiagnosticPayload,
    SessionLogoutDiagnosticInput,
    SessionRuntimeMetadata,
} from "@/features/auth/domain/authDiagnostics"

const MOBILE_CARD_API_PREFIXES = ["/api/v1/mobile-card", "/api/DigitalInternkort"] as const
const SESSION_LOGOUT_EVENTS_PATH = "client-events/session-logout"
const REPORT_TIMEOUT_MS = 1_500

const normalizeNullableString = (value: unknown): string | null =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : null

const getInternkortBaseUrl = (): string => {
    const configured = appEnv.internkortBaseUrl.trim()
    const base = configured.endsWith("/") ? configured.slice(0, -1) : configured

    for (const prefix of MOBILE_CARD_API_PREFIXES) {
        if (base.endsWith(prefix)) {
            return base
        }
    }

    return `${base}/api/v1/mobile-card`
}

const getSessionLogoutEventsUrl = (): string =>
    `${getInternkortBaseUrl()}/${SESSION_LOGOUT_EVENTS_PATH}`

const getRuntimeMetadata = (): SessionRuntimeMetadata => ({
    appVersion: normalizeNullableString(Constants.expoConfig?.version),
    executionEnvironment: normalizeNullableString(String(Constants.executionEnvironment)),
    platform: Platform.OS,
    runtimeVersion: normalizeNullableString(Updates.runtimeVersion),
    updateChannel: normalizeNullableString(Updates.channel),
    updateId: normalizeNullableString(Updates.updateId),
})

export const reportSessionLogoutDiagnostic = async (
    input: SessionLogoutDiagnosticInput,
): Promise<void> => {
    const controller = typeof AbortController === "undefined" ? null : new AbortController()
    const timeoutId =
        controller === null
            ? null
            : setTimeout(() => {
                  controller.abort()
              }, REPORT_TIMEOUT_MS)

    try {
        await fetch(getSessionLogoutEventsUrl(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(buildSessionLogoutDiagnosticPayload(input, getRuntimeMetadata())),
            signal: controller?.signal,
        })
    } catch {
        // Diagnostics are best-effort and must not block session handling.
    } finally {
        if (timeoutId !== null) {
            clearTimeout(timeoutId)
        }
    }
}
