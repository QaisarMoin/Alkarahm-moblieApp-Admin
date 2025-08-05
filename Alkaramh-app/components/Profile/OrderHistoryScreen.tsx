import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthContext from '../../context/AuthContext';
import { API_URL } from '../../api.json';
import { useTranslation } from 'react-i18next';

interface ProductInOrderItem {
  _id: string;
  name: {
    en: string;
    ar?: string;
  };
  image?: string[];
}

interface OrderItem {
  _id: string;
  product: ProductInOrderItem;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
  pricing?: {
    totalAmount?: number;
  };
}

const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { user, token, isLoading: isAuthLoading ,isGuest } = authContext || {};
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [appLang, setAppLang] = useState<'en' | 'ar'>('en');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchOrderHistory = async () => {
      const storedLang = await AsyncStorage.getItem('APP_LANGUAGE');
      setAppLang((storedLang as 'en' | 'ar') || 'en');

      if (!user?._id || !token) {
        if (!isAuthLoading) {
          setError('Please login to view your order history.');
        }
        setLoading(false);
        setOrders([]);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_URL}/orders/user?userId=${user._id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch order history.');
        }

        setOrders(data || []);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (!isAuthLoading) {
      fetchOrderHistory();
    }
  }, [user?._id, token, isAuthLoading]);

  const renderOrderItem = ({ item }: { item: Order }) => {
    const firstProduct = item.items?.[0]?.product;
    const productName = firstProduct?.name?.[appLang] || firstProduct?.name?.en || 'Unnamed Product';

    const firstItemImage = firstProduct?.baseImage?.[0] || 'https://via.placeholder.com/80';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
      >
        <View style={styles.orderCardHeader}>
          <Text style={styles.orderId}>Order ID: #{item._id.substring(0, 8)}...</Text>
          <Text style={styles.orderDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.orderCardBody}>
          <Image source={{ uri: firstItemImage }} style={styles.productImage} />
          <View style={styles.orderDetails}>
            <Text style={styles.itemSummary}>
              {productName}
              {item.items.length > 1 ? ` and ${item.items.length - 1} other(s)` : ''}
            </Text>
            <Text style={getOrderStatusStyle(item.status)}>{item.status}</Text>
          </View>
          <Text style={styles.orderTotal}>{item?.pricing?.totalAmount || item.totalAmount} QAR</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (isAuthLoading || loading) {
    return (
      <SafeAreaView style={styles.centeredView}>
        <ActivityIndicator size="large" color="#2A3B8F" />
        <Text style={styles.loadingText}>Loading order history...</Text>
      </SafeAreaView>
    );
  }

  if (isGuest) {
    return (
      <SafeAreaView style={styles.centeredView}>
        <Ionicons name="lock-closed-outline" size={wp('20%')} color="#ccc" />
        <Text style={styles.errorText}>{t('profile.guestRestrictedMsg') || 'Please login or create an account to access this feature.'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={wp('6%')} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={{ width: wp('6%') }} />
      </View>
*/}
      {error && (
        <View style={styles.centeredView}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!error && orders.length === 0 && (
        <View style={styles.centeredView}>
          <Ionicons name="file-tray-stacked-outline" size={wp('20%')} color="#ccc" />
          <Text style={styles.emptyOrdersText}>You have no orders yet.</Text>
        </View>
      )}

      {!error && orders.length > 0 && (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </SafeAreaView>
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
    padding: wp('1%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#333',
  },
  loadingText: {
    marginTop: hp('1%'),
    fontSize: wp('4%'),
    color: '#555',
  },
  errorText: {
    fontSize: wp('4%'),
    color: 'red',
    textAlign: 'center',
    marginTop: hp('2%'),
  },
  emptyOrdersText: {
    fontSize: wp('4.5%'),
    color: '#666',
    marginTop: hp('2%'),
  },
  listContentContainer: {
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('2%'),
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: wp('2.5%'),
    padding: wp('4%'),
    marginBottom: hp('1.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: hp('1%'),
    marginBottom: hp('1%'),
  },
  orderId: {
    fontSize: wp('3.8%'),
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: wp('3.5%'),
    color: '#777',
  },
  orderCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: wp('15%'),
    height: wp('15%'),
    borderRadius: wp('1.5%'),
    marginRight: wp('3%'),
    backgroundColor: '#eee',
  },
  orderDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  itemSummary: {
    fontSize: wp('3.8%'),
    color: '#555',
    marginBottom: hp('0.5%'),
  },
  orderTotal: {
    fontSize: wp('4%'),
    fontWeight: 'bold',
    color: '#2A3B8F',
    marginLeft: wp('2%'),
  },
});

const getOrderStatusStyle = (status: Order['status']) => ({
  fontSize: wp('3.5%'),
  fontWeight: 'bold' as 'bold',
  color:
    status.toLowerCase() === 'delivered'
      ? 'green'
      : status === 'Cancelled'
      ? 'red'
      : 'orange',
});

export default OrderHistoryScreen;
