import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { homeStyles as styles } from "./Homestyles";
import { useTranslation } from "react-i18next";

type FilterBarProps = {
  onSeeAllPress?: () => void;
  previouslyOrdered?: boolean;
  setPreviouslyOrdered?: (value: boolean | null) => void;
  rating4?: boolean;
  setrating4?: (value: boolean | null) => void;
  greatoffers?: boolean;
  setgreatoffers?: (value: boolean | null) => void;
  onApplyFilters?: (filters: any) => void;
  selectedSort: string | null;
  setSelectedSort: (sort: string | null) => void;
};

const filterKeys = [
  "Price High To Low",
  "Price Low To High",
  "Rating High To Low",
  "Rating Low To High",
];

const FilterBar: React.FC<FilterBarProps> = ({
  onApplyFilters,
  selectedSort,
  setSelectedSort,
}) => {
  const { t } = useTranslation();

  const toggleFilter = (key: string) => {
    const newSelectedSort = key === selectedSort ? null : key;
    setSelectedSort(newSelectedSort);

    let sortByPrice, sortByRating;
    if (key === "Price High To Low") sortByPrice = "highToLow";
    else if (key === "Price Low To High") sortByPrice = "lowToHigh";
    else sortByPrice = undefined;

    if (key === "Rating High To Low") sortByRating = "highToLow";
    else if (key === "Rating Low To High") sortByRating = "lowToHigh";
    else sortByRating = undefined;

    onApplyFilters?.({
      sortByPrice,
      sortByRating,
      selectedSort: newSelectedSort,
    });
  };

  // `Filter` should appear active if any filter is selected
  const isAnyFilterActive = selectedSort !== null;

  return (
    <View style={styles.filterBar}>
      <ScrollView showsHorizontalScrollIndicator={false} horizontal>
        <TouchableOpacity
          key={"Filter"}
          style={isAnyFilterActive ? styles.filterOptionclicked : styles.filterOption}
          onPress={() => {
            // Reset all filters if Filter is tapped while already active
            setSelectedSort(null);
            onApplyFilters?.({ sortByPrice: undefined, sortByRating: undefined, selectedSort: null });
          }}
        >
          <Feather name="sliders" color="black" style={styles.filterIcon} />
          <Text style={styles.filterText}>{t("Filter.Filter")}</Text>
          <Ionicons name="chevron-down" color="black" style={styles.filterArrow} />
         {/* <Text style={styles.filterArrow}>▼</Text> */}
        </TouchableOpacity>

        {filterKeys.map((key) => (
          <TouchableOpacity
            key={key}
            style={selectedSort === key ? styles.filterOptionclicked : styles.filterOption}
            onPress={() => toggleFilter(key)}
          >
            <Text style={styles.filterOptionText}>{key}</Text>
            {selectedSort === key && (
              <AntDesign name="close" style={styles.XArrow} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default FilterBar;
