import React from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"
import {
    countActiveEventFilters,
    createEmptyEventFilterState,
    DerivedTaxonomy,
    EventFilterState,
    getLocalizedTaxonomyGroupName,
    TAXONOMY_GROUP_ORDER,
} from "@/features/dashboard/domain/eventSelection"
import { FilterChip } from "@/features/dashboard/ui/components/FilterChip"

const getQuickTaxonomyGroups = (taxonomy: DerivedTaxonomy | undefined): string[] => {
    const available = new Set(taxonomy?.taxonomyGroups.map(g => g.name) ?? [])
    return TAXONOMY_GROUP_ORDER.filter(name => available.has(name))
}

interface EventFilterBarProps {
    activeFilterCount: number
    filters: EventFilterState
    language: "no" | "en"
    taxonomy: DerivedTaxonomy | undefined
    onChange: (filters: EventFilterState) => void
    onOpenFilters: () => void
}

export const EventFilterBar = ({
    activeFilterCount,
    filters,
    language,
    taxonomy,
    onChange,
    onOpenFilters,
}: EventFilterBarProps): React.JSX.Element => {
    const { t } = useTranslation()
    const quickGroups = getQuickTaxonomyGroups(taxonomy)

    return (
        <View className="gap-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pr-4">
                    <FilterChip
                        label={t("eventFilterAll")}
                        selected={countActiveEventFilters(filters) === 0}
                        onPress={() => onChange(createEmptyEventFilterState())}
                    />
                    {quickGroups.map(groupName => (
                        <FilterChip
                            key={groupName}
                            label={getLocalizedTaxonomyGroupName(groupName, language)}
                            selected={
                                filters.taxonomyGroup === groupName &&
                                filters.eventTypeIds.length === 0
                            }
                            onPress={() =>
                                onChange({
                                    ...filters,
                                    eventTypeIds: [],
                                    taxonomyGroup:
                                        filters.taxonomyGroup === groupName ? null : groupName,
                                })
                            }
                        />
                    ))}
                    <FilterChip
                        label={
                            activeFilterCount > 0
                                ? `${t("eventFilterMore")} (${activeFilterCount})`
                                : t("eventFilterMore")
                        }
                        selected={
                            filters.eventTypeIds.length > 0 || filters.organizerGroupIds.length > 0
                        }
                        onPress={onOpenFilters}
                    />
                </View>
            </ScrollView>
        </View>
    )
}
