import * as Haptics from "expo-haptics"

export async function triggerSelectionHaptic(): Promise<void> {
    try {
        await Haptics.selectionAsync()
    } catch {
        // Best effort only.
    }
}

export async function triggerSoftImpactHaptic(): Promise<void> {
    try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    } catch {
        // Best effort only.
    }
}
