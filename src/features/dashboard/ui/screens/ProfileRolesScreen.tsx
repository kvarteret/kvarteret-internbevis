import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, ListRenderItem, Pressable, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/app/providers/SessionProvider";
import {
  buildDisplayRoles,
  DisplayRoleRow,
  resolveDisplayedRole,
  serializeRoleSelection,
} from "@/features/dashboard/domain/profileRoles";
import { MemberHeader } from "@/features/dashboard/ui/components/MemberHeader";
import { Card } from "@/shared/ui/Card";
import { Text } from "@/shared/ui/Text";
import { cn } from "@/shared/utils/cn";

const getTierBadgeClass = (tier: number | null): string => {
  if (tier === null) {
    return "border border-border bg-surface";
  }

  switch (tier) {
    case 1:
      return "bg-[#16A34A]";
    case 2:
      return "bg-[#C2410C]";
    case 3:
      return "bg-[#0F766E]";
    default:
      return "bg-[#1D4ED8]";
  }
};

export const ProfileRolesScreen = (): React.JSX.Element => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const router = useRouter();
  const {
    user,
    selectedFrontpageRoleSelection,
    setSelectedFrontpageRoleSelection,
  } = useSession();
  const displayRoles = useMemo(
    () => (user ? buildDisplayRoles(user) : []),
    [user],
  );
  const selectedRole = useMemo(
    () => resolveDisplayedRole(displayRoles, selectedFrontpageRoleSelection),
    [displayRoles, selectedFrontpageRoleSelection],
  );

  useEffect(() => {
    navigation.setOptions({
      title: t("profileRolesTitle"),
    });
  }, [navigation, t]);

  useEffect(() => {
    if (!user) {
      if (router.canGoBack()) {
        router.back();
        return;
      }

      router.replace("/login");
    }
  }, [router, user]);

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-4">
        <Text className="text-base text-text-secondary">
          {t("notRegistered")}
        </Text>
      </SafeAreaView>
    );
  }

  const selectedRoleKey = selectedRole?.selectionKey ?? null;

  const renderRole: ListRenderItem<DisplayRoleRow> = ({ item }) => {
    const isSelected = selectedRoleKey === item.selectionKey;
    const hasTier = item.rabattTrinn !== null;
    const displayName =
      item.source === "virtual_pingvin"
        ? t("profileRoleVirtualPingvin")
        : item.navn;

    return (
      <Pressable
        accessibilityLabel={`${item.gruppe} ${displayName}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        className="mb-2"
        onPress={() =>
          void setSelectedFrontpageRoleSelection(serializeRoleSelection(item))
        }
      >
        <Card
          className={cn(
            "flex-row items-center justify-between gap-3 px-4 py-3",
            isSelected ? "border-2 border-link bg-[#FFFFFF80]" : null,
          )}
          effect="liquid"
          variant="grouped"
        >
          <View className="min-w-0 flex-1">
            <Text className="text-base font-semibold" numberOfLines={1}>
              {displayName}
            </Text>
            <Text className="text-sm text-text-secondary" numberOfLines={1}>
              {item.gruppe}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                "rounded-full px-3 py-1",
                getTierBadgeClass(item.rabattTrinn),
              )}
            >
              <Text
                className={cn(
                  "text-xs font-bold",
                  hasTier ? "text-surface" : "text-text-secondary",
                )}
              >
                {hasTier ? t("tierLabel", { tier: item.rabattTrinn }) : "-"}
              </Text>
            </View>

            {isSelected ? (
              <MaterialIcons
                accessibilityLabel={t("profileRoleSelected")}
                color="#0F766E"
                name="check-circle"
                size={20}
              />
            ) : null}
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <SafeAreaView
      className="flex-1 bg-background"
      edges={["top", "left", "right", "bottom"]}
    >
      <FlatList
        className="flex-1"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingVertical: 12,
          paddingBottom: 24,
        }}
        data={displayRoles}
        keyExtractor={(item, index) => `${item.selectionKey}:${index}`}
        renderItem={renderRole}
        ListHeaderComponent={
          <View className="mb-3 gap-3">
            <Text className="px-1 text-lg text-text-primary font-bold">
              {t("profileMemberInfo")}
            </Text>

            <Card className="p-2" effect="liquid" variant="grouped">
              <MemberHeader
                animationTrigger={0}
                firstName={user.fornavn}
                imageUrl={user.bildeUrl}
                lastName={user.etternavn}
                roleGroup={selectedRole?.gruppe ?? ""}
                roleTitle={
                  selectedRole?.source === "virtual_pingvin"
                    ? t("profileRoleVirtualPingvin")
                    : (selectedRole?.navn ?? "")
                }
              />
            </Card>

            <Card
              className="flex-row items-center justify-between px-4 py-4"
              effect="liquid"
              variant="grouped"
            >
              <Text className="text-base text-text-secondary font-medium">
                {t("profileTotalPingvinPoeng")}
              </Text>
              <Text className="text-2xl font-extrabold">
                {user.pingvinPoengSum}
              </Text>
            </Card>

            <Text className="px-1 pt-1 text-lg text-text-primary font-bold">
              {t("profileActiveRoles")}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Card className="px-4 py-5" effect="liquid" variant="grouped">
            <Text className="text-base text-text-secondary">
              {t("profileNoActiveRoles")}
            </Text>
          </Card>
        }
      />
    </SafeAreaView>
  );
};
