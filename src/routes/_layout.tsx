import { NativeStackNavigationOptions } from "@react-navigation/native-stack"
import { Stack, useRouter, useSegments } from "expo-router"
import React, { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { ActivityIndicator, Alert, Image, Platform, View } from "react-native"
import "../../global.css"
import "@/app/localization/i18n"
import { AppProviders } from "@/app/providers/AppProviders"
import { useLanguage } from "@/app/providers/LanguageProvider"
import { usePrivacyConsent } from "@/app/providers/PrivacyConsentProvider"
import { useSession } from "@/app/providers/SessionProvider"
import { AndroidHeaderMenuButton } from "@/features/dashboard/ui/components/AndroidHeaderMenuButton"
import { useHeaderMenuActions } from "@/features/dashboard/ui/menu/useHeaderMenuActions"
import { shouldShowPrivacyNoticeDialog } from "@/features/privacy/domain/privacyConsent"
import { useNavigationStyles } from "@/shared/theme/use-navigation-styles"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"

const PrivacyDialogCoordinator = (): null => {
    const { t } = useTranslation()
    const router = useRouter()
    const segments = useSegments()
    const { hasAcknowledgedCurrentPolicy, acknowledgeCurrentPolicy } = usePrivacyConsent()
    const [dialogRetryKey, setDialogRetryKey] = useState(0)
    const isAcceptingRef = useRef(false)
    const isDialogVisibleRef = useRef(false)

    useEffect(() => {
        if (isAcceptingRef.current) {
            return
        }

        if (
            !shouldShowPrivacyNoticeDialog({
                firstSegment: segments[0],
                hasAcknowledgedCurrentPolicy,
            })
        ) {
            isDialogVisibleRef.current = false
            return
        }

        if (isDialogVisibleRef.current) {
            return
        }

        isDialogVisibleRef.current = true

        Alert.alert(
            t("privacyDialogTitle"),
            t("privacyDialogMessage"),
            [
                {
                    text: t("privacyDialogRead"),
                    onPress: () => {
                        isDialogVisibleRef.current = false
                        router.push("/privacy")
                    },
                },
                {
                    text: t("privacyDialogContinue"),
                    onPress: () => {
                        isAcceptingRef.current = true
                        isDialogVisibleRef.current = false

                        void acknowledgeCurrentPolicy()
                            .then(() => {
                                isAcceptingRef.current = false
                            })
                            .catch(() => {
                                isAcceptingRef.current = false

                                Alert.alert(
                                    t("privacyDialogErrorTitle"),
                                    t("privacyDialogErrorMessage"),
                                    [
                                        {
                                            text: t("close"),
                                            onPress: () => {
                                                setDialogRetryKey(current => current + 1)
                                            },
                                        },
                                    ],
                                    {
                                        cancelable: false,
                                    },
                                )
                            })
                    },
                },
            ],
            {
                cancelable: false,
            },
        )
    }, [
        acknowledgeCurrentPolicy,
        dialogRetryKey,
        hasAcknowledgedCurrentPolicy,
        router,
        segments,
        t,
    ])

    return null
}

const RootNavigator = (): React.JSX.Element => {
    const { t } = useTranslation()
    const { user, isAnonymous, isHydrating: sessionHydrating } = useSession()
    const { isHydrating: languageHydrating } = useLanguage()
    const { isHydrating: privacyHydrating } = usePrivacyConsent()
    const { menuActions, nativeMenuItems, onMenuAction } = useHeaderMenuActions()
    const colors = useThemeRuntimeColors()
    const { rootContentStyle, androidHeaderStyle } = useNavigationStyles()

    if (languageHydrating || privacyHydrating || (sessionHydrating && !user && !isAnonymous)) {
        return (
            <View className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color={colors.textPrimary} size="large" />
            </View>
        )
    }

    const rootScreenOptions: NativeStackNavigationOptions = {
        contentStyle: rootContentStyle,
        headerBackTitle: "",
        headerTintColor: colors.textPrimary,
        ...(Platform.OS === "ios"
            ? {
                  headerTransparent: true,
                  headerShadowVisible: false,
                  headerBackButtonDisplayMode: "minimal" as const,
              }
            : {
                  // Android: top app bar uses a tonal surface with shadow separation.
                  headerStyle: androidHeaderStyle as NativeStackNavigationOptions["headerStyle"],
                  headerShadowVisible: true,
              }),
    }

    return (
        <>
            <PrivacyDialogCoordinator />

            <Stack screenOptions={rootScreenOptions}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        title: "DET AKADEMISKE KVARTER",
                        headerTitleStyle: {
                            color: colors.editorialInk,
                            fontSize: 14,
                            fontWeight: "800",
                        },
                        headerTitleAlign: "center",
                        ...(Platform.OS === "ios"
                            ? {
                                  unstable_headerLeftItems: () => [
                                      {
                                          type: "custom" as const,
                                          hidesSharedBackground: true,
                                          element: (
                                              <Image
                                                  accessible={false}
                                                  source={require("@assets/images/nobg-header.png")}
                                              />
                                          ),
                                      },
                                  ],
                              }
                            : {
                                  headerLeft: () => (
                                      <View pointerEvents="none">
                                          <Image
                                              accessible={false}
                                              source={require("@assets/images/nobg-header.png")}
                                          />
                                      </View>
                                  ),
                              }),
                        ...(Platform.OS === "ios"
                            ? {
                                  unstable_headerRightItems: () => [
                                      {
                                          type: "menu" as const,
                                          label: t("openMenu"),
                                          icon: {
                                              type: "sfSymbol" as const,
                                              name: "line.3.horizontal",
                                          },
                                          menu: {
                                              items: nativeMenuItems,
                                          },
                                      },
                                  ],
                              }
                            : {
                                  headerRight: () => (
                                      <AndroidHeaderMenuButton
                                          openMenuLabel={t("openMenu")}
                                          menuActions={menuActions}
                                          onMenuAction={id => {
                                              void onMenuAction(id)
                                          }}
                                      />
                                  ),
                              }),
                    }}
                />
                <Stack.Screen
                    name="profile-roles"
                    options={{
                        presentation: Platform.OS === "ios" ? "pageSheet" : "fullScreenModal",
                        animation: Platform.OS === "ios" ? "default" : "slide_from_bottom",
                    }}
                />
                <Stack.Screen
                    name="chess-time-control"
                    options={{
                        presentation: Platform.OS === "ios" ? "pageSheet" : "fullScreenModal",
                        animation: Platform.OS === "ios" ? "default" : "slide_from_bottom",
                    }}
                />
                <Stack.Screen name="privacy" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="about" />
                <Stack.Screen name="games" />
                <Stack.Screen name="nerd-stats" />
                <Stack.Screen
                    name="event/[eventId]"
                    options={{
                        headerShadowVisible: false,
                        headerTitleStyle: {
                            color: colors.textPrimary,
                        },
                    }}
                />
            </Stack>
        </>
    )
}

export default function RootLayout(): React.JSX.Element {
    return (
        <AppProviders>
            <RootNavigator />
        </AppProviders>
    )
}
