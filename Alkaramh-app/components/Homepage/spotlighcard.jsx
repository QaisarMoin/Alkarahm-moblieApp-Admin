import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity , ScrollView , SafeAreaView} from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import Rectangle358 from "../../assets/Rectangle358.svg"
import { RectangleSVGComponent, StarSVGComponent, TickSVGComponent } from './svgs/svgComponents';

const SpotlightCardItem = ({ shop, onPress }) => {
  const {
    imageUrl,
    deliveryTime,
    businessName,
    rating ,
    hasNoComplaints ,
    isBestseller ,
    isFrequentlyReordered ,
  } = shop;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(shop)}>
      <View style={styles.imageContainer}>
        <Image
          source={imageUrl ? { uri: imageUrl } : require('../../assets/green.jpeg')}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* SVG Background positioned behind timeBadge */}
        <View style={styles.svgContainer}>
          <RectangleSVGComponent />
        </View>
        
        <View style={styles.timeBadge}>
          <Text style={styles.timeIcon}>⏱</Text>
          <Text style={styles.timeText}>{`30 - 40 min`}</Text>  {/* deliveryTime is hardcoded for now */}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.businessName}>{businessName}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.rating}>{rating?.toFixed(1) }</Text>
            <Text style={styles.star}>★</Text>
          </View>
        </View>

        <View style={styles.statusContainer}>
          {!hasNoComplaints && (
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark" size={14} color="#1E9E6A" style={styles.checkmark} />
              <Text style={styles.statusText}>Last 100 Orders Without Complaints</Text>
            </View>
          )}

          <View style={styles.bottomBadges}>
            {!isBestseller && (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark" size={14} color="#1E9E6A" style={styles.checkmark} />
                <Text style={styles.statusText}>Bestseller</Text>
              </View>
            )}

            {!isFrequentlyReordered && (
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark" size={14} color="#1E9E6A" style={styles.checkmark} />
                <Text style={styles.statusText}>Frequently Reordered</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};


// keep your existing styles here...
export default SpotlightCardItem;





const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  svgContainer: {
    position: 'absolute',
    bottom: -130,
    left: -12,
    zIndex: 0, // Behind everything
  },
  timeBadge: {
    position: 'absolute',
    bottom: -16,
    left: -12,
    backgroundColor: 'transparent', // Make transparent since SVG provides background
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopRightRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1, // Above SVG but behind content
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 6,
    left: 10,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    left: 10,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  ratingContainer: {
    backgroundColor: '#156739',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  star: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  statusContainer: {
    gap: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
      backgroundColor: '#f8f9fa',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  checkmark: {
    color: '#459D75',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  bottomBadges: {
    flexDirection: 'row',
    gap: 8,
  },
});



