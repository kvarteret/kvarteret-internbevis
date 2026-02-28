import {
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { Stack } from "expo-router";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Image, Platform, View } from "react-native";
import "../../global.css";
import "@/app/localization/i18n";
import { AppProviders } from "@/app/providers/AppProviders";
import { useLanguage } from "@/app/providers/LanguageProvider";
import { useSession } from "@/app/providers/SessionProvider";
import { AndroidHeaderMenuButton } from "@/features/dashboard/ui/components/AndroidHeaderMenuButton";
import { useHeaderMenuActions } from "@/features/dashboard/ui/menu/useHeaderMenuActions";
import { getIOSCapabilities } from "@/shared/platform/ios-version";
import { themeColors } from "@/shared/theme/colors";

const RootNavigator = (): React.JSX.Element => {
  const { t } = useTranslation();
  const { isHydrating: sessionHydrating } = useSession();
  const { isHydrating: languageHydrating } = useLanguage();
  const { menuActions, nativeMenuItems, onMenuAction } = useHeaderMenuActions();
  const { supportsHeaderBlurFallback, supportsScrollEdgeEffects } =
    getIOSCapabilities();

  if (sessionHydrating || languageHydrating) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={themeColors.textPrimary} size="large" />
      </View>
    );
  }

  const rootScreenOptions: NativeStackNavigationOptions = {
    contentStyle: { backgroundColor: themeColors.background },
    headerBackTitle: "",
    headerTintColor: themeColors.textPrimary,
    ...(Platform.OS === "ios"
      ? {
          headerTransparent: true,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal" as const,
          ...(supportsScrollEdgeEffects
            ? {
                scrollEdgeEffects: {
                  top: "automatic",
                },
              }
            : supportsHeaderBlurFallback
              ? {
                  headerBlurEffect: "systemMaterial",
                }
              : undefined),
        }
      : {
          // Android: top app bar uses a tonal surface with shadow separation.
          headerStyle: { backgroundColor: themeColors.androidHeaderSurface },
          headerShadowVisible: true,
        }),
  };

  return (
    <Stack screenOptions={rootScreenOptions}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="(tabs)"
        options={{
          title: "DET AKADEMISKE KVARTER",
          headerTitleStyle: {
            color: themeColors.editorialInk,
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
                    onMenuAction={(id) => {
                      void onMenuAction(id);
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
      <Stack.Screen name="privacy" />
      <Stack.Screen name="about" />
      <Stack.Screen name="games" />
      <Stack.Screen
        name="event/[eventId]"
        options={{
          headerShadowVisible: false,
          headerTitleStyle: {
            color: themeColors.textPrimary,
          },
        }}
      />
    </Stack>
  );
};

export default function RootLayout(): React.JSX.Element {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
