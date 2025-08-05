import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useContext, useState, useEffect } from 'react';
import {
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import AuthContext from '../../context/AuthContext';
import { API_URL } from '../../api.json';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTranslation } from 'react-i18next';
interface Product {
  _id: string;
  name: {
    en: string;
    ar?: string;
  };
  description?: {
    en: string;
    ar?: string;
  };
  price?: number;
  baseImage: string[];
  variants?: {
    price: number;
  }[];
}

const WishlistScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { user, token, isLoading: isAuthLoading } = authContext || {};

  const [wishlistItems, setWishlistItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('guestMode').then(flag => setIsGuest(flag === 'true'));
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const fetchWishlist = async () => {
        if (!user?._id || !token) {
          if (!isAuthLoading) {
            setError('Please login to view your wishlist.');
          }
          setLoading(false);
          setWishlistItems([]);
          return;
        }

        setLoading(true);
        setError(null);

        try {
          const response = await fetch(`${API_URL}/wishlist?userId=${user._id}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Failed to fetch wishlist.');
          }

          const validItems = Array.isArray(data) ? data : [];
          setWishlistItems(validItems);
        } catch (err: any) {
          console.log('Fetch error:', err.message || err);
          setError(err.message || 'An unexpected error occurred.');
        } finally {
          setLoading(false);
        }
      };

      if (!isAuthLoading) {
        fetchWishlist();
      }

      return () => {}; // Cleanup if needed
    }, [user?._id, token, isAuthLoading])
  );

  const removeFromWishlist = async (productId: string) => {
    if (!user?._id || !token) return;

    try {
      const response = await fetch(`${API_URL}/wishlist/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user._id,
          productId: productId,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to remove item.');
      }

      setWishlistItems((prev) => prev.filter((item) => item._id !== productId));
      Alert.alert('Removed', 'Item removed from wishlist.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred.');
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const productPrice = item.variants?.[0]?.price ?? item.price ?? 0;

    return (
      <View style={styles.productItemContainer}>
        <TouchableOpacity
          style={{ flexDirection: 'row', flex: 1 }}
          onPress={() => navigation.navigate('ProductIndetail', { productID: item._id })}
        >
          <Image
            source={{
              uri: item.baseImage?.[0] || 'https://via.placeholder.com/100',
            }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name.en}</Text>
            <Text style={styles.productPrice}>{productPrice} QAR</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => removeFromWishlist(item._id)}
          style={styles.removeButton}
        >
          <Ionicons name="trash-outline" size={wp('5.5%')} color="#ff4444" />
        </TouchableOpacity>
      </View>
    );
  };

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredView}>
          <Ionicons name="lock-closed-outline" size={wp('20%')} color="#ccc" />
          <Text style={styles.errorText}>{t('profile.guestRestrictedMsg') || 'Please login or create an account to access this feature.'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isAuthLoading || loading) {
    return (
      <SafeAreaView style={styles.centeredView}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F6FB" /> 
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ fontSize: wp('4%'), color: '#666', textAlign: 'center' }}>
          Loading wishlist...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'space-between' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FB" /> 

      <SafeAreaView style={styles.container}>
        {/* Header 
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={wp('6%')} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Wishlist</Text>
          <View style={{ width: wp('6%') }} />
        </View>
*/}
        {error && (
          <View style={styles.centeredView}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!error && wishlistItems.length === 0 && (
          <View style={styles.centeredView}>
            <Ionicons name="heart-outline" size={wp('20%')} color="#ccc" />
            <Text style={styles.emptyWishlistText}>{t('MyWishlist.empty')}</Text>
          </View>
        )}

        {!error && wishlistItems.length > 0 && (
          <FlatList
            data={wishlistItems}
            renderItem={renderProductItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContentContainer}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FB',
    paddingBottom: 80,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('5%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('1.5%'),
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  listContentContainer: {
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
  },
  productItemContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: wp('3%'),
    marginBottom: hp('1.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    alignItems: 'center',
  },
  productImage: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: 6,
    marginRight: wp('3%'),
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: wp('4%'),
    fontWeight: '600',
    color: '#444',
    marginBottom: hp('0.5%'),
  },
  productPrice: {
    fontSize: wp('3.8%'),
    color: '#007bff',
    fontWeight: 'bold',
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp('2%'),
  },
  errorText: {
    fontSize: wp('4%'),
    color: '#cc',
    textAlign: 'center',
  },
  emptyWishlistText: {
    fontSize: wp('4.5%'),
    color: '#666',
    textAlign: 'center',
  },
});

export default WishlistScreen;
