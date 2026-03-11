import { useNavigation, useRouter } from "expo-router"
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, ScrollView, View } from "react-native"
import { getStoredJson, setStoredJson } from "@/core/storage/asyncStorage"
import {
    CHESS_TIME_CONTROL_OPTIONS,
    CHESS_TIME_CONTROL_STORAGE_KEY,
    ChessTimeControl,
    ChessTimeControlPreset,
    createCustomChessTimeControl,
    findMatchingChessTimeControlOption,
    formatChessTimeControl,
    getChessTimeControlIncrementSeconds,
    getChessTimeControlMinutesPerSide,
    getDefaultChessTimeControl,
    parseStoredChessTimeControl,
    sanitizeChessNumericInput,
} from "@/features/games/domain/chessTimeControl"
import { Card } from "@/shared/ui/Card"
import { Text } from "@/shared/ui/Text"
import { TextField } from "@/shared/ui/TextField"
import { cn } from "@/shared/utils/cn"

const DEFAULT_CHESS_TIME_CONTROL = getDefaultChessTimeControl()

const getPresetLabelKey = (
    preset: ChessTimeControlPreset,
):
    | "chessPresetBlitz"
    | "chessPresetBullet"
    | "chessPresetClassic"
    | "chessPresetCustom"
    | "chessPresetRapid" => {
    switch (preset) {
        case "bullet":
            return "chessPresetBullet"
        case "classic":
            return "chessPresetClassic"
        case "blitz":
            return "chessPresetBlitz"
        case "custom":
            return "chessPresetCustom"
        case "rapid":
        default:
            return "chessPresetRapid"
    }
}

const getInputValues = (
    timeControl: ChessTimeControl,
): { incrementInput: string; minutesInput: string } => ({
    minutesInput: String(getChessTimeControlMinutesPerSide(timeControl)),
    incrementInput: String(getChessTimeControlIncrementSeconds(timeControl)),
})

const buildCustomTimeControl = (
    minutesInput: string,
    incrementInput: string,
    fallbackTimeControl: ChessTimeControl,
): ChessTimeControl => {
    const fallbackMinutes = getChessTimeControlMinutesPerSide(fallbackTimeControl)
    const fallbackIncrement = getChessTimeControlIncrementSeconds(fallbackTimeControl)
    const parsedMinutes = Number.parseInt(minutesInput, 10)
    const parsedIncrement = Number.parseInt(incrementInput, 10)

    return createCustomChessTimeControl(
        Number.isNaN(parsedMinutes) ? fallbackMinutes : parsedMinutes,
        Number.isNaN(parsedIncrement) ? fallbackIncrement : parsedIncrement,
    )
}

export const ChessTimeControlScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const router = useRouter()
    const [draftTimeControl, setDraftTimeControl] = useState(DEFAULT_CHESS_TIME_CONTROL)
    const [minutesInput, setMinutesInput] = useState(
        () => getInputValues(DEFAULT_CHESS_TIME_CONTROL).minutesInput,
    )
    const [incrementInput, setIncrementInput] = useState(
        () => getInputValues(DEFAULT_CHESS_TIME_CONTROL).incrementInput,
    )

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("chessTimeControlPickerTitle") })
    }, [navigation, t])

    const syncInputs = useCallback((timeControl: ChessTimeControl): void => {
        const nextInputs = getInputValues(timeControl)
        setMinutesInput(nextInputs.minutesInput)
        setIncrementInput(nextInputs.incrementInput)
    }, [])

    const persistDraftTimeControl = useCallback(
        async (timeControl: ChessTimeControl): Promise<void> => {
            setDraftTimeControl(timeControl)
            await setStoredJson(CHESS_TIME_CONTROL_STORAGE_KEY, timeControl)
        },
        [],
    )

    useEffect(() => {
        let isMounted = true

        const hydrateTimeControl = async (): Promise<void> => {
            try {
                const storedTimeControl = parseStoredChessTimeControl(
                    await getStoredJson<unknown>(CHESS_TIME_CONTROL_STORAGE_KEY),
                )
                const nextTimeControl = storedTimeControl ?? DEFAULT_CHESS_TIME_CONTROL

                if (!isMounted) {
                    return
                }

                setDraftTimeControl(nextTimeControl)
                syncInputs(nextTimeControl)
            } catch {
                if (isMounted) {
                    setDraftTimeControl(DEFAULT_CHESS_TIME_CONTROL)
                    syncInputs(DEFAULT_CHESS_TIME_CONTROL)
                }
            }
        }

        void hydrateTimeControl()

        return () => {
            isMounted = false
        }
    }, [syncInputs])

    const updateCustomDraftTimeControl = useCallback(
        (nextMinutesInput: string, nextIncrementInput: string): void => {
            const nextTimeControl = buildCustomTimeControl(
                nextMinutesInput,
                nextIncrementInput,
                draftTimeControl,
            )

            setDraftTimeControl(nextTimeControl)
            void setStoredJson(CHESS_TIME_CONTROL_STORAGE_KEY, nextTimeControl)
        },
        [draftTimeControl],
    )

    const commitCustomDraftTimeControl = useCallback((): void => {
        const nextTimeControl = buildCustomTimeControl(
            minutesInput,
            incrementInput,
            draftTimeControl,
        )
        syncInputs(nextTimeControl)
        setDraftTimeControl(nextTimeControl)
        void setStoredJson(CHESS_TIME_CONTROL_STORAGE_KEY, nextTimeControl)
    }, [draftTimeControl, incrementInput, minutesInput, syncInputs])

    const handleMinutesChange = useCallback(
        (value: string): void => {
            const sanitizedValue = sanitizeChessNumericInput(value).slice(0, 3)
            setMinutesInput(sanitizedValue)
            updateCustomDraftTimeControl(sanitizedValue, incrementInput)
        },
        [incrementInput, updateCustomDraftTimeControl],
    )

    const handleIncrementChange = useCallback(
        (value: string): void => {
            const sanitizedValue = sanitizeChessNumericInput(value).slice(0, 2)
            setIncrementInput(sanitizedValue)
            updateCustomDraftTimeControl(minutesInput, sanitizedValue)
        },
        [minutesInput, updateCustomDraftTimeControl],
    )

    const handleSelectTimeControl = useCallback(
        async (timeControl: ChessTimeControl): Promise<void> => {
            syncInputs(timeControl)
            await persistDraftTimeControl(timeControl)

            if (router.canGoBack()) {
                router.back()
                return
            }

            router.replace("/games")
        },
        [persistDraftTimeControl, router, syncInputs],
    )

    const selectedPresetOption = useMemo(
        () => findMatchingChessTimeControlOption(draftTimeControl),
        [draftTimeControl],
    )

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentContainerClassName="gap-4 p-4 pb-8"
                contentInsetAdjustmentBehavior="automatic"
            >
                <View className="flex-row flex-wrap gap-3">
                    {CHESS_TIME_CONTROL_OPTIONS.map(option => {
                        const selected = selectedPresetOption?.key === option.key

                        return (
                            <Pressable
                                key={option.key}
                                accessibilityLabel={`${formatChessTimeControl(option.timeControl)} ${t(
                                    getPresetLabelKey(option.timeControl.preset),
                                )}`}
                                accessibilityRole="button"
                                accessibilityState={{ selected }}
                                onPress={() => {
                                    void handleSelectTimeControl(option.timeControl)
                                }}
                                style={{ flexBasis: "31%", flexGrow: 1 }}
                            >
                                <Card
                                    className={cn(
                                        "min-h-28 items-center justify-center gap-2 px-3 py-4",
                                        selected ? "border-2 border-link bg-surface/80" : null,
                                    )}
                                    effect="liquid"
                                    variant="grouped"
                                >
                                    <Text
                                        className="text-3xl font-bold"
                                        style={{ fontVariant: ["tabular-nums"] }}
                                    >
                                        {formatChessTimeControl(option.timeControl)}
                                    </Text>
                                    <Text
                                        className={cn(
                                            "text-lg",
                                            selected ? null : "text-text-secondary",
                                        )}
                                    >
                                        {t(getPresetLabelKey(option.timeControl.preset))}
                                    </Text>
                                </Card>
                            </Pressable>
                        )
                    })}
                </View>

                <Card
                    className={cn(
                        "gap-3 px-4 py-4",
                        selectedPresetOption ? null : "border-2 border-link bg-surface/80",
                    )}
                    effect="liquid"
                    variant="grouped"
                >
                    <Text className="text-base font-semibold">{t("chessPresetCustom")}</Text>

                    <View className="flex-row items-center gap-3">
                        <TextField
                            accessibilityLabel={t("chessMinutesPerSide")}
                            className="flex-1 text-center text-2xl font-bold"
                            keyboardType="number-pad"
                            maxLength={3}
                            onBlur={commitCustomDraftTimeControl}
                            onChangeText={handleMinutesChange}
                            onSubmitEditing={commitCustomDraftTimeControl}
                            placeholder={t("chessTimeControlCustomMinutesPlaceholder")}
                            returnKeyType="done"
                            style={{ fontVariant: ["tabular-nums"] }}
                            value={minutesInput}
                        />

                        <Text
                            className="text-2xl font-bold"
                            style={{ fontVariant: ["tabular-nums"] }}
                        >
                            +
                        </Text>

                        <TextField
                            accessibilityLabel={t("chessIncrementSeconds")}
                            className="flex-1 text-center text-2xl font-bold"
                            keyboardType="number-pad"
                            maxLength={2}
                            onBlur={commitCustomDraftTimeControl}
                            onChangeText={handleIncrementChange}
                            onSubmitEditing={commitCustomDraftTimeControl}
                            placeholder={t("chessTimeControlCustomIncrementPlaceholder")}
                            returnKeyType="done"
                            style={{ fontVariant: ["tabular-nums"] }}
                            value={incrementInput}
                        />
                    </View>
                </Card>
            </ScrollView>
        </View>
    )
}
