import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';

interface FilterPopupProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters?: (filters: FilterState) => void;
  selectedSort: string | null;
  setSelectedSort: (sort: string | null) => void;
}

interface FilterState {
  sortBy?: string;
  rating?: number | null;
  sortByPrice?: "lowToHigh" | "highToLow";
}

const sortOptionsList = [
  "Rating : High to Low",
  "Rating : Low to High",
  "Cost for one: Low to High",
  "Cost for one: High to Low",
];

const FilterPopup: React.FC<FilterPopupProps> = ({ visible, onClose, onApplyFilters, selectedSort, setSelectedSort }) => {
  // Remove all local selected state

  const getSortByPrice = (): "lowToHigh" | "highToLow" | undefined => {
    if (selectedSort === "Cost for one: Low to High") return "lowToHigh";
    if (selectedSort === "Cost for one: High to Low") return "highToLow";
    return undefined;
  };
  const getSortByRating = (): "lowToHigh" | "highToLow" | undefined => {
    if (selectedSort === "Rating : Low to High") return "lowToHigh";
    if (selectedSort === "Rating : High to Low") return "highToLow";
    return undefined;
  };

  const [selectedRating, setSelectedRating] = React.useState<number | null>(null);

  const handleClearAll = () => {
    setSelectedSort(null);
    setSelectedRating(null);
  };

  const handleShowResults = () => {
    const filters = {
      sortBy: selectedSort ?? undefined,
      rating: selectedRating,
      sortByPrice: getSortByPrice(),
      sortByRating: getSortByRating(),
      selectedSort: selectedSort,
    };
    onApplyFilters?.(filters);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <Text style={styles.title}>Filters and sorting</Text>
              <TouchableOpacity style={styles.clearAll} onPress={handleClearAll}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
              <View style={styles.body}>
                <View style={styles.sidebar}>
                  <TouchableOpacity
                    style={[styles.tab, true && styles.activeTab]}
                    onPress={() => {}}
                  >
                    <Image
                      style={{ marginTop: 4 }}
                      source={require('../../assets/Vector2.png')}
                    />
                    <Text style={[styles.tabText, true && styles.activeTabText]}>
                      Sort by
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.mainContent}>
                  <View style={styles.sortList}>
                    <Text style={styles.sortTitle}>Sort by</Text>
                    <View style={{ backgroundColor: "#FFFFFF" }}>
                      {sortOptionsList.map((option) => (
                        <TouchableOpacity
                          key={option}
                          style={[
                            styles.sortOption,
                            selectedSort === option && styles.activeSortOption,
                          ]}
                          onPress={() => {
                            const newSort = selectedSort === option ? null : option;
                            setSelectedSort(newSort);
                          }}
                        >
                          <Text style={styles.sortText}>{option}</Text>
                          <View style={styles.radio}>
                            {selectedSort === option && <View style={styles.radioInnerDot} />}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.footer}>
                <TouchableOpacity onPress={onClose}>
                  <Text style={styles.closeText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.disabledButton} onPress={handleShowResults}>
                  <Text style={styles.disabledButtonText}>Show results</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};



const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: hp('60%'),
    backgroundColor: '#fff',
    borderTopLeftRadius: wp('5%'),
    borderTopRightRadius: wp('5%'),
    overflow: 'hidden',
  },
  title: {
    paddingTop: hp('2%'),
    paddingHorizontal: wp('5%'),
    fontSize: hp('2.3%'),
    fontWeight: '500',
  },
  clearAll: {
    position: 'absolute',
    right: wp('5%'),
    top: hp('2%'),
  },
  clearAllText: {
    color: '#607D8B',
    fontSize: hp('1.8%'),
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    marginTop: hp('2%'),
  },
  sidebar: {
    width: wp('25%'),
    borderRightWidth: 1,
    borderRightColor: '#eee',
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: hp('3%'),
    justifyContent: 'center',
    paddingVertical: hp('1.5%'),
  },
  activeTab: {
    backgroundColor: '#EEF0FF',
    alignItems: 'center',
    justifyContent: 'center',
    width: wp('25%'),
    height: hp('10%'),
    borderRightWidth: 2,
    borderColor: '#283593',
  },
  tabText: {
    fontSize: hp('1.5%'),
    color: '#888',
    textAlign: 'center',
    marginTop: hp('0.5%'),
  },
  activeTabText: {
    color: '#283593',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    padding: wp('4%'),
  },
  sortTitle: {
    fontSize: hp('2%'),
    fontWeight: '600',
    marginBottom: hp('1.5%'),
  },
  sortList: {
    backgroundColor: '#F6F7FB',
    borderRadius: wp('3%'),
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('3%'),
  },
  sortOption: {
    paddingVertical: hp('2%'),
    paddingHorizontal: wp('2%'),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeSortOption: {
    backgroundColor: '#E0E7FF',
    borderRadius: wp('3%'),
  },
  sortText: {
    fontSize: hp('1.9%'),
    color: '#000',
  },
  radio: {
    width: wp('4.5%'),
    height: wp('4.5%'),
    borderRadius: wp('2.25%'),
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: wp('2.5%'),
    height: wp('2.5%'),
    borderRadius: wp('1.25%'),
    backgroundColor: '#283593',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: hp('3%'),
    paddingHorizontal: wp('8%'),
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeText: {
    fontSize: hp('2%'),
    color: '#555',
  },
  disabledButton: {
    backgroundColor: '#283593',
    paddingHorizontal: wp('7%'),
    paddingVertical: hp('1.7%'),
    borderRadius: wp('2%'),
  },
  disabledButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: hp('1.9%'),
  },
});

export default FilterPopup;
