import React, { useEffect, useState, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ScrollView,
  View,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { API_URL } from '../../api.json';
import SpotlightCardItem from './spotlighcard';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import AuthContext from '@/context/AuthContext';
import Shopoutline from './shop-test';
import i18n from '@/i18n';

type ShopCard = {
  id: string;
  imageUrl: string;
  businessName: string;
  deliveryTime: string;
  rating: number;
  hasNoComplaints: boolean;
  isBestseller: boolean;
  isFrequentlyReordered: boolean;
  originalShop: any;
  reviewCount: number;
};

const SpotlightCardList = ({ language = 'en', previouslyOrdered = null, OnSellAll, rating4 = null, greatoffers = null }: any) => {
  const isArabic = i18n.language === 'ar';

  const authContext = useContext(AuthContext);
  const { user, token } = authContext || {};
  const { t } = useTranslation();
  const [data, setData] = useState<ShopCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    // Get user's latitude and longitude from AsyncStorage
    let userLat = null;
    let userLng = null;
    try {
      const userLatStr = await AsyncStorage.getItem('userLat');
      const userLngStr = await AsyncStorage.getItem('userLng');
      userLat = userLatStr ? parseFloat(userLatStr) : null;
      userLng = userLngStr ? parseFloat(userLngStr) : null;
    } catch (e) {
      console.log('Could not get user location from AsyncStorage', e);
    }

    // Haversine distance function
    function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
      const toRad = (x: number) => (x * Math.PI) / 180;
      const R = 6371; // km
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
          Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    // Delivery time estimation based on distance
    function calculateDeliveryTimeFromLatLng(
      shopLocation: { lat?: number; lng?: number } | undefined,
      userLat: number | null,
      userLng: number | null
    ): string {
      if (
        userLat == null ||
        userLng == null ||
        !shopLocation ||
        typeof shopLocation.lat !== 'number' ||
        typeof shopLocation.lng !== 'number'
      ) {
        return '120 - 150 mins';
      }

      const distance = haversineDistance(userLat, userLng, shopLocation.lat, shopLocation.lng);
      // Example: 15 min base + 6 min per km, clamp to 120-150 min as max
      const minTime = Math.round(15 + distance * 6);
      const maxTime = minTime + 30;
      // Clamp to a min/max range if needed
      const minClamped = Math.max(10, Math.min(minTime, 120));
      const maxClamped = Math.max(20, Math.min(maxTime, 150));
      

      return `${minClamped} - ${maxClamped} mins`;


    }

        const queryParam = previouslyOrdered !== null
      ? `?previouslyOrdered=${previouslyOrdered}&limit=20`
      : `?limit=20`;

      const ratingParam = rating4 !== null
      ? `&minRating=4`
      : '&minRating=0';
      

    


    try {
      const response = await fetch(`${API_URL}/shops${queryParam}${ratingParam}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();

      if (json.success && json.data) {
        const transformed = (json.data as any[]).map((shop: any) => ({
          id: shop._id,
          imageUrl: shop.banner,
          businessName: isArabic ? shop.name.ar : shop.name.en,
          deliveryTime: calculateDeliveryTimeFromLatLng(
            shop.address?.coordinates
              ? {
                  lat: shop.address.coordinates.latitude,
                  lng: shop.address.coordinates.longitude,
                }
              : shop.location,
            userLat,
            userLng
          ),
          rating: shop.statistics?.rating,
          hasNoComplaints:
            shop.statistics?.reviewCount >= 0 && shop.statistics?.rating >= 0,
          isBestseller: shop.statistics?.totalOrders >= 0,
          isFrequentlyReordered:
            shop.statistics?.totalOrders >= 0 && shop.statistics?.rating >= 0,
          originalShop: shop,
          reviewCount: shop.statistics?.reviewCount,


        })).reverse();

        setData(transformed);
      } else {
        throw new Error(json.message || 'Failed to fetch data');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Re-fetch spotlight data when `previouslyOrdered` changes
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [previouslyOrdered,rating4]);

  const handlePress = (shop: any) => {
    OnSellAll ? OnSellAll(shop) : console.log('Pressed:', shop.businessName);
  };

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#2d5a2d" style={{ marginTop: 20 }} />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ fontSize: hp('2%'), marginLeft: 10, color: '#6A6D76' }}>
        {t('Shop.IN THE SPOTLIGHT')}
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {data.map((item: ShopCard) => (
          <Shopoutline key={item.id} shop={item} onPress={() => handlePress(item)} />
        ))}
      </ScrollView>
    </View>
  );
};

export default SpotlightCardList;
