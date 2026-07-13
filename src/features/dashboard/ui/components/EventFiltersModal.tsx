import React from "react"
import { useTranslation } from "react-i18next"
import { Modal, Pressable, ScrollView, View } from "react-native"
import {
    createEmptyEventFilterState,
    DerivedTaxonomy,
    EventFilterState,
    getLocalizedTaxonomyGroupName,
} from "@/features/dashboard/domain/eventSelection"
import { FilterChip } from "@/features/dashboard/ui/components/FilterChip"
import { Button } from "@/shared/ui/Button"
import { Text } from "@/shared/ui/Text"

const toggleFilterValue = (values: string[], value: string): string[] =>
    values.includes(value) ? values.filter(item => item !== value) : [...values, value]

interface EventFiltersModalProps {
    eventCount: number
    filters: EventFilterState
    language: "no" | "en"
    taxonomy: DerivedTaxonomy | undefined
    visible: boolean
    onChange: (filters: EventFilterState) => void
    onClose: () => void
}

export const EventFiltersModal = ({
    eventCount,
    filters,
    language,
    taxonomy,
    visible,
    onChange,
    onClose,
}: EventFiltersModalProps): React.JSX.Element => {
    const { t } = useTranslation()

    return (
        <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
            <View className="flex-1 justify-end bg-black/25">
                <View className="max-h-[88%] rounded-t-3xl bg-background px-5 pb-8 pt-5">
                    <View className="mb-5 flex-row items-center justify-between">
                        <Text className="text-3xl text-editorial-ink font-black">
                            {t("eventFilterTitle")}
                        </Text>
                        <Pressable
                            accessibilityRole="button"
                            onPress={() => onChange(createEmptyEventFilterState())}
                        >
                            <Text className="text-sm uppercase tracking-widest text-editorial-action font-extrabold">
                                {t("eventFilterReset")}
                            </Text>
                        </Pressable>
                    </View>
                    <ScrollView contentContainerClassName="gap-7">
                        <View className="gap-5">
                            <Text className="text-sm uppercase tracking-widest text-editorial-action font-extrabold">
                                {t("eventFilterType")}
                            </Text>
                            {taxonomy?.taxonomyGroups.map(group => (
                                <View className="gap-3" key={group.name}>
                                    <Text className="text-4xl leading-tight text-editorial-ink font-black">
                                        {getLocalizedTaxonomyGroupName(group.name, language)}
                                    </Text>
                                    <View className="flex-row flex-wrap gap-3">
                                        {group.eventTypes.map(eventType => (
                                            <FilterChip
                                                key={eventType._id}
                                                label={eventType.name}
                                                selected={filters.eventTypeIds.includes(
                                                    eventType._id,
                                                )}
                                                onPress={() =>
                                                    onChange({
                                                        ...filters,
                                                        eventTypeIds: toggleFilterValue(
                                                            filters.eventTypeIds,
                                                            eventType._id,
                                                        ),
                                                        taxonomyGroup: null,
                                                    })
                                                }
                                                variant="outlined"
                                            />
                                        ))}
                                    </View>
                                </View>
                            ))}
                        </View>
                        <View className="gap-3 border-t border-border-soft pt-6">
                            <Text className="text-sm uppercase tracking-widest text-editorial-action font-extrabold">
                                {t("eventFilterOrganizer")}
                            </Text>
                            <View className="flex-row flex-wrap gap-2">
                                {taxonomy?.organizerGroups.map(group => (
                                    <FilterChip
                                        key={group._id}
                                        label={group.name}
                                        selected={filters.organizerGroupIds.includes(group._id)}
                                        onPress={() =>
                                            onChange({
                                                ...filters,
                                                organizerGroupIds: toggleFilterValue(
                                                    filters.organizerGroupIds,
                                                    group._id,
                                                ),
                                            })
                                        }
                                    />
                                ))}
                            </View>
                        </View>
                    </ScrollView>
                    <Button className="mt-6" onPress={onClose}>
                        {t("eventFilterShowCount", { count: eventCount })}
                    </Button>
                </View>
            </View>
        </Modal>
    )
}
