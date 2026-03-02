import Constants from "expo-constants"
import * as Localization from "expo-localization"
import * as Updates from "expo-updates"
import { useNavigation } from "expo-router"
import { Accelerometer, Gyroscope } from "expo-sensors"
import React, { useEffect, useLayoutEffect, useMemo, useState } from "react"
import { Dimensions, PixelRatio, Platform, ScrollView, View } from "react-native"
import { useTranslation } from "react-i18next"
import { Card } from "@/shared/ui/Card"
import { EtjenestenFooter } from "@/shared/ui/EtjenestenFooter"
import { LabeledValueRow } from "@/shared/ui/LabeledValueRow"
import { Text } from "@/shared/ui/Text"

interface VectorMeasurement {
    x: number
    y: number
    z: number
    timestamp: number
}

interface StatItem {
    key: string
    label: string
    value: string
}

interface StatSection {
    key: string
    title: string
    rows: StatItem[]
}

const SENSOR_UPDATE_INTERVAL_MS = 450

const formatUnknown = (value: unknown, fallback: string): string => {
    if (value === null || value === undefined || value === "") {
        return fallback
    }
    if (typeof value === "string") {
        return value
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value)
    }
    if (value instanceof Date) {
        return value.toISOString()
    }
    try {
        return JSON.stringify(value)
    } catch {
        return fallback
    }
}

const formatVector = (measurement: VectorMeasurement | null, fallback: string): string => {
    if (!measurement) {
        return fallback
    }

    return `x ${measurement.x.toFixed(3)} · y ${measurement.y.toFixed(3)} · z ${measurement.z.toFixed(3)}`
}

const formatRNVersion = (fallback: string): string => {
    const platformConstants = Platform.constants as {
        reactNativeVersion?: { major: number; minor: number; patch: number }
    }

    const version = platformConstants.reactNativeVersion
    if (!version) {
        return fallback
    }

    return `${version.major}.${version.minor}.${version.patch}`
}

export const NerdStatsScreen = (): React.JSX.Element => {
    const { t } = useTranslation()
    const navigation = useNavigation()
    const [accelerometerAvailable, setAccelerometerAvailable] = useState<boolean | null>(null)
    const [gyroscopeAvailable, setGyroscopeAvailable] = useState<boolean | null>(null)
    const [accelerometerData, setAccelerometerData] = useState<VectorMeasurement | null>(null)
    const [gyroscopeData, setGyroscopeData] = useState<VectorMeasurement | null>(null)

    useLayoutEffect(() => {
        navigation.setOptions({ title: t("nerdStatsTitle") })
    }, [navigation, t])

    useEffect(() => {
        let isMounted = true
        let accelerometerSubscription: { remove: () => void } | null = null
        let gyroscopeSubscription: { remove: () => void } | null = null

        const setupSensors = async (): Promise<void> => {
            const [isAccelerometerSupported, isGyroscopeSupported] = await Promise.all([
                Accelerometer.isAvailableAsync(),
                Gyroscope.isAvailableAsync(),
            ])

            if (!isMounted) {
                return
            }

            setAccelerometerAvailable(isAccelerometerSupported)
            setGyroscopeAvailable(isGyroscopeSupported)

            if (isAccelerometerSupported) {
                Accelerometer.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS)
                accelerometerSubscription = Accelerometer.addListener(setAccelerometerData)
            }

            if (isGyroscopeSupported) {
                Gyroscope.setUpdateInterval(SENSOR_UPDATE_INTERVAL_MS)
                gyroscopeSubscription = Gyroscope.addListener(setGyroscopeData)
            }
        }

        void setupSensors()

        return () => {
            isMounted = false
            accelerometerSubscription?.remove()
            gyroscopeSubscription?.remove()
        }
    }, [])

    const unavailableText = t("nerdStatsUnavailable")
    const enabledText = t("nerdStatsEnabled")
    const disabledText = t("nerdStatsDisabled")
    const calendar = Localization.getCalendars()[0]
    const locale = Localization.getLocales()[0]
    const windowDimensions = Dimensions.get("window")
    const screenDimensions = Dimensions.get("screen")
    const runtimeGlobal = globalThis as typeof globalThis & {
        HermesInternal?: unknown
        nativeFabricUIManager?: unknown
        __turboModuleProxy?: unknown
    }

    const sections = useMemo<StatSection[]>(
        () => [
            {
                key: "runtime",
                title: t("nerdStatsRuntimeSection"),
                rows: [
                    {
                        key: "execution-environment",
                        label: "Execution env",
                        value: formatUnknown(Constants.executionEnvironment, unavailableText),
                    },
                    {
                        key: "dev-mode",
                        label: "Dev mode",
                        value: __DEV__ ? enabledText : disabledText,
                    },
                    {
                        key: "js-engine",
                        label: "JS engine",
                        value: runtimeGlobal.HermesInternal ? "Hermes" : "Other",
                    },
                    {
                        key: "react-native-version",
                        label: "React Native",
                        value: formatRNVersion(unavailableText),
                    },
                    {
                        key: "fabric-enabled",
                        label: "Fabric",
                        value: runtimeGlobal.nativeFabricUIManager ? enabledText : disabledText,
                    },
                    {
                        key: "turbo-modules",
                        label: "Turbo Modules",
                        value: runtimeGlobal.__turboModuleProxy ? enabledText : disabledText,
                    },
                ],
            },
            {
                key: "build",
                title: t("nerdStatsBuildSection"),
                rows: [
                    {
                        key: "app-version",
                        label: "App version",
                        value: formatUnknown(Constants.expoConfig?.version, unavailableText),
                    },
                    {
                        key: "android-version-code",
                        label: "Android versionCode",
                        value: formatUnknown(Constants.expoConfig?.android?.versionCode, unavailableText),
                    },
                    {
                        key: "android-package",
                        label: "Android package",
                        value: formatUnknown(Constants.expoConfig?.android?.package, unavailableText),
                    },
                    {
                        key: "runtime-version",
                        label: "Runtime version",
                        value: formatUnknown(Updates.runtimeVersion, unavailableText),
                    },
                    {
                        key: "update-channel",
                        label: "Update channel",
                        value: formatUnknown(Updates.channel, unavailableText),
                    },
                    {
                        key: "update-id",
                        label: "Update ID",
                        value: formatUnknown(Updates.updateId, unavailableText),
                    },
                    {
                        key: "embedded-launch",
                        label: "Embedded launch",
                        value: Updates.isEmbeddedLaunch ? enabledText : disabledText,
                    },
                ],
            },
            {
                key: "device",
                title: t("nerdStatsDeviceSection"),
                rows: [
                    {
                        key: "platform",
                        label: "Platform",
                        value: formatUnknown(Platform.OS, unavailableText),
                    },
                    {
                        key: "platform-version",
                        label: "Platform version",
                        value: formatUnknown(Platform.Version, unavailableText),
                    },
                    {
                        key: "system-version",
                        label: "System version",
                        value: formatUnknown(Constants.systemVersion, unavailableText),
                    },
                    {
                        key: "device-name",
                        label: "Device name",
                        value: formatUnknown(Constants.deviceName, unavailableText),
                    },
                    {
                        key: "is-device",
                        label: "Physical device",
                        value: Constants.isDevice ? enabledText : disabledText,
                    },
                ],
            },
            {
                key: "display",
                title: t("nerdStatsDisplaySection"),
                rows: [
                    {
                        key: "locale",
                        label: "Locale",
                        value: formatUnknown(locale?.languageTag, unavailableText),
                    },
                    {
                        key: "timezone",
                        label: "Timezone",
                        value: formatUnknown(calendar?.timeZone, unavailableText),
                    },
                    {
                        key: "window-size",
                        label: "Window",
                        value: `${windowDimensions.width} x ${windowDimensions.height}`,
                    },
                    {
                        key: "screen-size",
                        label: "Screen",
                        value: `${screenDimensions.width} x ${screenDimensions.height}`,
                    },
                    {
                        key: "pixel-ratio",
                        label: "Pixel ratio",
                        value: PixelRatio.get().toFixed(2),
                    },
                    {
                        key: "font-scale",
                        label: "Font scale",
                        value: PixelRatio.getFontScale().toFixed(2),
                    },
                ],
            },
            {
                key: "sensors",
                title: t("nerdStatsSensorSection"),
                rows: [
                    {
                        key: "accelerometer-status",
                        label: "Accelerometer",
                        value:
                            accelerometerAvailable === null
                                ? unavailableText
                                : accelerometerAvailable
                                  ? enabledText
                                  : disabledText,
                    },
                    {
                        key: "accelerometer-values",
                        label: "Accel values",
                        value: formatVector(accelerometerData, unavailableText),
                    },
                    {
                        key: "gyroscope-status",
                        label: "Gyroscope",
                        value:
                            gyroscopeAvailable === null
                                ? unavailableText
                                : gyroscopeAvailable
                                  ? enabledText
                                  : disabledText,
                    },
                    {
                        key: "gyroscope-values",
                        label: "Gyro values",
                        value: formatVector(gyroscopeData, unavailableText),
                    },
                ],
            },
        ],
        [
            accelerometerAvailable,
            accelerometerData,
            calendar?.timeZone,
            disabledText,
            enabledText,
            gyroscopeAvailable,
            gyroscopeData,
            locale?.languageTag,
            screenDimensions.height,
            screenDimensions.width,
            t,
            unavailableText,
            windowDimensions.height,
            windowDimensions.width,
        ],
    )

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                contentInsetAdjustmentBehavior="automatic"
                contentContainerClassName="gap-3 px-4 pb-8 pt-4"
            >
                {sections.map(section => (
                    <Card key={section.key} className="gap-1 px-4 py-4" effect="liquid" variant="grouped">
                        <Text className="text-lg font-extrabold">{section.title}</Text>
                        {section.rows.map(row => (
                            <LabeledValueRow key={row.key} label={row.label} value={row.value} />
                        ))}
                    </Card>
                ))}

                <EtjenestenFooter />
            </ScrollView>
        </View>
    )
}
