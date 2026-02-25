import type { MenuAction } from "@react-native-menu/menu";
import {
  NativeStackNavigationOptions,
  type NativeStackHeaderItemMenuAction,
  type NativeStackHeaderItemMenuSubmenu,
} from "@react-navigation/native-stack";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  View,
} from "react-native";
import "../../global.css";
import "@/app/localization/i18n";
import { AppProviders } from "@/app/providers/AppProviders";
import { useLanguage } from "@/app/providers/LanguageProvider";
import { useSession } from "@/app/providers/SessionProvider";
import { extractAccessTokenFromUrl } from "@/core/linking/deepLinkParser";
import { setPendingDeepLinkToken } from "@/core/linking/pendingToken";
import { NativeHeaderMenuButton } from "@/features/dashboard/ui/components/NativeHeaderMenuButton";
import {
  buildNativeMenuActions,
  NATIVE_MENU_ACTION_ID,
} from "@/features/dashboard/ui/menu/nativeMenuActions";
import { themeColors } from "@/shared/theme/colors";

const IOS_SCROLL_EDGE_VERSION = 26;

const getMajorIOSVersion = (): number | null => {
  if (Platform.OS !== "ios") return null;

  if (typeof Platform.Version === "number") {
    return Number.isFinite(Platform.Version)
      ? Math.trunc(Platform.Version)
      : null;
  }

  if (typeof Platform.Version === "string") {
    const [major = ""] = Platform.Version.split(".");
    const parsed = Number.parseInt(major, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const IOS_MAJOR_VERSION = getMajorIOSVersion();
const SUPPORTS_SCROLL_EDGE_EFFECTS =
  Platform.OS === "ios" &&
  IOS_MAJOR_VERSION !== null &&
  IOS_MAJOR_VERSION >= IOS_SCROLL_EDGE_VERSION;
const SUPPORTS_IOS_HEADER_BLUR_FALLBACK =
  Platform.OS === "ios" &&
  IOS_MAJOR_VERSION !== null &&
  IOS_MAJOR_VERSION < IOS_SCROLL_EDGE_VERSION;

const toNativeMenuIcon = (image?: string) =>
  image
    ? {
        type: "sfSymbol" as const,
        name: image as any,
      }
    : undefined;

const toNativeMenuItem = (
  action: MenuAction,
  onAction: (id: string) => void,
): NativeStackHeaderItemMenuAction | NativeStackHeaderItemMenuSubmenu => {
  const actionId = action.id ?? action.title;

  if (action.subactions && action.subactions.length > 0) {
    return {
      type: "submenu",
      label: action.title,
      icon: toNativeMenuIcon(action.image),
      inline: action.displayInline ?? false,
      items: action.subactions.map((subaction) =>
        toNativeMenuItem(subaction, onAction),
      ),
    };
  }

  return {
    type: "action",
    label: action.title,
    description: action.subtitle,
    icon: toNativeMenuIcon(action.image),
    destructive: action.attributes?.destructive,
    disabled: action.attributes?.disabled,
    hidden: action.attributes?.hidden,
    state: action.state,
    onPress: () => onAction(actionId),
  };
};

const toNativeMenuItems = (
  actions: MenuAction[],
  onAction: (id: string) => void,
): (NativeStackHeaderItemMenuAction | NativeStackHeaderItemMenuSubmenu)[] =>
  actions.map((action) => toNativeMenuItem(action, onAction));

const RootNavigator = (): React.JSX.Element => {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    user,
    isHydrating: sessionHydrating,
    logout,
    exitAnonymousMode,
  } = useSession();
  const { isHydrating: languageHydrating, changeLanguage } = useLanguage();

  useEffect(() => {
    let mounted = true;

    const handleUrl = async (url: string): Promise<void> => {
      const accessToken = extractAccessTokenFromUrl(url);
      if (mounted && accessToken) {
        setPendingDeepLinkToken(accessToken);
      }
    };

    void Linking.getInitialURL().then((url) => {
      if (url) {
        void handleUrl(url);
      }
    });

    const subscription = Linking.addEventListener("url", (event) => {
      void handleUrl(event.url);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const isLoggedIn = Boolean(user);
  const menuActions = useMemo(
    () =>
      buildNativeMenuActions({
        t,
        isLoggedIn,
      }),
    [isLoggedIn, t],
  );

  const handleMenuAction = useCallback(
    async (id: string): Promise<void> => {
      switch (id) {
        case NATIVE_MENU_ACTION_ID.privacy:
          router.push("/privacy");
          return;
        case NATIVE_MENU_ACTION_ID.about:
          router.push("/about");
          return;
        case NATIVE_MENU_ACTION_ID.games:
          router.push("/games");
          return;
        case NATIVE_MENU_ACTION_ID.languageNo:
          await changeLanguage("no");
          return;
        case NATIVE_MENU_ACTION_ID.languageEn:
          await changeLanguage("en");
          return;
        case NATIVE_MENU_ACTION_ID.authLogout:
          await logout();
          return;
        case NATIVE_MENU_ACTION_ID.authLogin:
          await exitAnonymousMode();
          router.replace("/login");
          return;
        default:
          return;
      }
    },
    [changeLanguage, exitAnonymousMode, logout, router],
  );
  const nativeMenuItems = useMemo(
    () =>
      toNativeMenuItems(menuActions, (id) => {
        void handleMenuAction(id);
      }),
    [menuActions, handleMenuAction],
  );

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
          ...(SUPPORTS_SCROLL_EDGE_EFFECTS
            ? {
                scrollEdgeEffects: {
                  top: "automatic",
                },
              }
            : SUPPORTS_IOS_HEADER_BLUR_FALLBACK
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
                  <NativeHeaderMenuButton
                    openMenuLabel={t("openMenu")}
                    menuActions={menuActions}
                    onMenuAction={(id) => {
                      void handleMenuAction(id);
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
