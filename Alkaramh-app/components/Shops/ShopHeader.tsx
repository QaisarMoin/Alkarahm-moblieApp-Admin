import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useNavigation, useRoute } from '@react-navigation/native';
import i18n from '@/i18n';

const isArabic = i18n.language === "ar";
const ShopHeaderSection = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();

  const shop = route.params?.shop || {};
  const {
    businessName = "Shop",
    deliveryTime = "N/A",
    rating = 0,
    hasNoComplaints = true,
    isBestseller = true,
    isFrequentlyReordered = true,
  } = shop;

  const hasTags = hasNoComplaints || isBestseller || isFrequentlyReordered;

  const dynamicTags = hasTags
    ? [
        hasNoComplaints && "Last 100 Orders Without Complaints",
        isBestseller && "Bestseller",
        isFrequentlyReordered && "Frequently Reordered",
      ].filter(Boolean)
    : ["Last 100 Orders Without Complaints","Bestseller","Frequently Reordered"]; // default tags

  const displayRating = rating > 0 ? rating.toFixed(1) : "4.0";
  const displayReviewNote = "5k ratings";

  return (
    <View style={styles.container}>
      {/* Title Row */}
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <TouchableOpacity onPress={() =>  navigation.goBack()}>
          <Ionicons
        name={isArabic ? "chevron-forward" : "chevron-back"}
        size={24}
        color="black"
      />

          </TouchableOpacity>
          <Text style={styles.title}>{businessName}</Text>
        </View>

        <View style={styles.ratingContainer}>
          <Text style={styles.ratingText}>{displayRating}</Text>
          <Ionicons name="star" size={12} color="white" />
        </View>
      </View>

      {/* Time & Rating Count */}
      <View style={styles.rowBetween}>
        <View style={styles.row}>
          <Ionicons name="time-outline" size={14} color="gray" />
          <Text style={styles.timeText}>{deliveryTime}</Text>
        </View>
        <Text style={styles.ratingCount}>{displayReviewNote}</Text>
      </View>

      {/* Tags */}
      <View style={styles.tagsRow}>
        {dynamicTags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Ionicons name="checkmark" size={14} color="#1E9E6A" style={styles.tagIcon} />
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: wp('4%'),
    paddingTop: hp('1%'),
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('0.8%'),
  },
  title: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    marginLeft: wp('2%'),
  },
  ratingContainer: {
    flexDirection: 'row',
    backgroundColor: '#156739',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  ratingText: {
    color: 'white',
    fontSize: wp('3.2%'),
    marginRight: 8,
  },
  timeText: {
    marginLeft: 4,
    fontSize: wp('3.2%'),
    color: 'gray',
  },
  ratingCount: {
    fontSize: wp('3%'),
    color: 'gray',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: hp('1%'),
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },
  tagIcon: {
    marginRight: 6,
  },
  tagText: {
    fontSize: wp('3.2%'),
    color: '#333',
  },
});

export default ShopHeaderSection;
