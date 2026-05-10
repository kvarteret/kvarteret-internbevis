import { MaterialIcons } from "@expo/vector-icons"
import React from "react"
import { useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"
import { DisplayRoleRow } from "@/features/dashboard/domain/profileRoles"
import { useThemeRuntimeColors } from "@/shared/theme/use-theme-runtime-colors"
import { Text } from "@/shared/ui/Text"
import { cn } from "@/shared/utils/cn"

interface SelectedFrontpageRolesGridProps {
    getRoleTitle?: (role: DisplayRoleRow) => string
    pressHint?: string
    pressLabel?: string
    roles: DisplayRoleRow[]
    onRolePress?: () => void
    compact?: boolean
    size?: "compact" | "default"
    reserveMaxHeight?: boolean
    showOrderBadge?: boolean
    showChevron?: boolean
}

interface RoleTileProps {
    compact: boolean
    getRoleTitle?: (role: DisplayRoleRow) => string
    onPress?: () => void
    pressHint?: string
    pressLabel?: string
    role: DisplayRoleRow
    hidden?: boolean
    showChevron: boolean
    showOrderBadge: boolean
    slotOrder: number
}

const RoleTile = ({
    compact,
    getRoleTitle,
    onPress,
    pressHint,
    pressLabel,
    role,
    hidden = false,
    showChevron,
    showOrderBadge,
    slotOrder,
}: RoleTileProps): React.JSX.Element => {
    const { t } = useTranslation()
    const { textSecondary } = useThemeRuntimeColors()
    const displayName = getRoleTitle
        ? getRoleTitle(role)
        : role.source === "virtual_pingvin"
          ? t("profileRoleVirtualPingvin")
          : role.navn
    const tileClassName = cn(
        "w-full flex-row items-center rounded-2xl bg-text-primary/5",
        compact ? "gap-2 px-3 py-3" : "gap-3 px-4 py-3.5",
    )
    const titleClassName = compact
        ? "text-base font-extrabold text-editorial-ink"
        : "text-xl font-extrabold text-editorial-ink"
    const subtitleClassName = compact
        ? "text-sm text-text-secondary"
        : "text-base text-text-secondary"
    const orderBadge = (
        <View className="h-7 w-7 items-center justify-center rounded-full bg-text-primary/10">
            <Text className="text-sm font-bold text-editorial-ink">{slotOrder}</Text>
        </View>
    )

    const content = (
        <View className={cn(tileClassName, hidden ? "opacity-0" : null)}>
            <View className="min-w-0 flex-1 gap-0.5">
                <Text className={titleClassName} numberOfLines={1}>
                    {displayName}
                </Text>
                <Text className={subtitleClassName} numberOfLines={1}>
                    {role.gruppe}
                </Text>
            </View>

            <View className="flex-row items-center gap-2">
                {showOrderBadge ? orderBadge : null}

                {showChevron ? (
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-text-primary/10">
                        <MaterialIcons color={textSecondary} name="chevron-right" size={24} />
                    </View>
                ) : null}
            </View>
        </View>
    )

    if (!onPress) {
        return content
    }

    return (
        <Pressable
            accessibilityHint={pressHint}
            accessibilityLabel={pressLabel}
            accessibilityRole="button"
            className="w-full"
            onPress={onPress}
        >
            {content}
        </Pressable>
    )
}

const createPlaceholderRole = (): DisplayRoleRow => ({
    source: "active",
    selectionKey: "placeholder",
    navn: "-",
    gruppe: "-",
    rabattTrinn: null,
    pingvinPoeng: 0,
    signertKontrakt: false,
})

export const SelectedFrontpageRolesGrid = ({
    getRoleTitle,
    pressHint,
    pressLabel,
    roles,
    onRolePress,
    compact = false,
    size = "default",
    reserveMaxHeight = false,
    showOrderBadge = false,
    showChevron = false,
}: SelectedFrontpageRolesGridProps): React.JSX.Element => {
    const isCompact = compact || size === "compact"
    const visibleRoles = roles.slice(0, 3)
    const topRole = visibleRoles[0]
    const lowerRoles = visibleRoles.slice(1)
    const placeholderRole = createPlaceholderRole()

    return (
        <View className={cn("w-full", isCompact ? "gap-2" : "gap-3")}>
            {topRole ? (
                <RoleTile
                    compact={isCompact}
                    getRoleTitle={getRoleTitle}
                    onPress={onRolePress}
                    pressHint={pressHint}
                    pressLabel={pressLabel}
                    role={topRole}
                    showChevron={Boolean(onRolePress) && showChevron && !isCompact}
                    showOrderBadge={showOrderBadge}
                    slotOrder={1}
                />
            ) : reserveMaxHeight ? (
                <RoleTile
                    compact={isCompact}
                    role={placeholderRole}
                    hidden
                    showChevron={false}
                    showOrderBadge={false}
                    slotOrder={1}
                />
            ) : (
                <RoleTile
                    compact={isCompact}
                    getRoleTitle={getRoleTitle}
                    onPress={onRolePress}
                    pressHint={pressHint}
                    pressLabel={pressLabel}
                    role={placeholderRole}
                    showChevron={Boolean(onRolePress) && showChevron && !isCompact}
                    showOrderBadge={false}
                    slotOrder={1}
                />
            )}

            {lowerRoles.length === 1 ? (
                <RoleTile
                    compact={isCompact}
                    getRoleTitle={getRoleTitle}
                    onPress={onRolePress}
                    pressHint={pressHint}
                    pressLabel={pressLabel}
                    role={lowerRoles[0]}
                    showChevron={Boolean(onRolePress) && showChevron && !isCompact}
                    showOrderBadge={showOrderBadge}
                    slotOrder={2}
                />
            ) : reserveMaxHeight && lowerRoles.length === 0 ? (
                <RoleTile
                    compact={isCompact}
                    role={placeholderRole}
                    hidden
                    showChevron={false}
                    showOrderBadge={false}
                    slotOrder={2}
                />
            ) : null}

            {lowerRoles.length >= 2 ? (
                <View className={cn("w-full flex-row", isCompact ? "gap-2" : "gap-3")}>
                    <View className="min-w-0 flex-1">
                        <RoleTile
                            compact={isCompact}
                            getRoleTitle={getRoleTitle}
                            onPress={lowerRoles[0] ? onRolePress : undefined}
                            pressHint={pressHint}
                            pressLabel={pressLabel}
                            role={lowerRoles[0] ?? placeholderRole}
                            hidden={!lowerRoles[0]}
                            showChevron={false}
                            showOrderBadge={showOrderBadge && Boolean(lowerRoles[0])}
                            slotOrder={2}
                        />
                    </View>

                    <View className="min-w-0 flex-1">
                        <RoleTile
                            compact={isCompact}
                            getRoleTitle={getRoleTitle}
                            onPress={lowerRoles[1] ? onRolePress : undefined}
                            pressHint={pressHint}
                            pressLabel={pressLabel}
                            role={lowerRoles[1] ?? placeholderRole}
                            hidden={!lowerRoles[1]}
                            showChevron={false}
                            showOrderBadge={showOrderBadge && Boolean(lowerRoles[1])}
                            slotOrder={3}
                        />
                    </View>
                </View>
            ) : null}
        </View>
    )
}
