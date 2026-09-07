import type React from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, View } from "react-native"
import {
    countActiveEventFilters,
    createEmptyEventFilterState,
    type DerivedTaxonomy,
    type EventFilterState,
    getLocalizedTaxonomyGroupName,
} from "@/features/dashboard/domain/eventSelection"
import { FilterChip } from "@/features/dashboard/ui/components/FilterChip"

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
    const quickGroups = taxonomy?.taxonomyGroups ?? []

    return (
        <View className="gap-3">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2 pr-4">
                    <FilterChip
                        label={t("eventFilterAll")}
                        selected={countActiveEventFilters(filters) === 0}
                        onPress={() => onChange(createEmptyEventFilterState())}
                    />
                    {quickGroups.map(group => (
                        <FilterChip
                            key={group._id}
                            label={getLocalizedTaxonomyGroupName(group.name, language)}
                            selected={
                                filters.taxonomyGroup === group._id &&
                                filters.eventTypeIds.length === 0
                            }
                            onPress={() =>
                                onChange({
                                    ...filters,
                                    eventTypeIds: [],
                                    taxonomyGroup:
                                        filters.taxonomyGroup === group._id ? null : group._id,
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
