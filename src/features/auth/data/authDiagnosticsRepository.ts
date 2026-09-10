import { emitOperationalDiagnostic } from "@/core/observability"
import type { SessionLogoutDiagnosticInput } from "@/features/auth/domain/authDiagnostics"

export const reportSessionLogoutDiagnostic = async (
    input: SessionLogoutDiagnosticInput,
): Promise<void> => {
    await emitOperationalDiagnostic(input.eventName, {
        authErrorCode: input.authErrorCode,
        authErrorStatus: input.authErrorStatus,
    })
}
