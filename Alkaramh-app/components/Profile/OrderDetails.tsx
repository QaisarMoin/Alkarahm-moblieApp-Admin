import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import AuthContext from '../../context/AuthContext';
import { API_URL } from '../../api.json';

const statusColors = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#0ea5e9',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const OrderDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { token, user } = useContext(AuthContext) || {};
  const orderId = route.params?.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!token || !user?._id || !orderId) return;

      setLoading(true);
      setError('');

      try {
        const res = await fetch(`${API_URL}/orders?userId=${user._id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');

        const matchedOrder = data.find((order) => order._id === orderId);
        if (!matchedOrder) throw new Error('Order not found for this user');
     //   console.log(matchedOrder.items[0].product.baseImage);
        setOrder(matchedOrder);
      } catch (err) {
        setError(err.message || 'Something went wrong.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetail();
  }, [token, orderId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2A3B8F" />
        <Text style={styles.status}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={[styles.status, { color: 'red' }]}>{error || 'Order not found.'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header 
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={wp('6%')} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Summary</Text>
        <View style={{ width: wp('6%') }} />
      </View>
*/}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {/* ORDER HEADER */}
          <View style={styles.section}>
            <Text style={styles.label}>Order ID:</Text>
            <Text style={styles.value}>{order._id}</Text>
            <Text style={[styles.statusBadge, { backgroundColor: statusColors[order.status] || '#ccc' }]}>
              {order.status}
            </Text>
          </View>

          {/* ITEMS */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Items</Text>
            {order.items.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Image
                  source={{ uri: item.product?.baseImage[0] || 'https://via.placeholder.com/80' }}
                  style={styles.productImage}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {item.product?.name?.en || item.variantSnapshot?.name?.en || 'Unnamed Product'}
                  </Text>
                  <Text style={styles.itemQty}>Qty: {item.quantity}</Text>
                  <Text style={styles.itemPrice}>
                    {item.unitPrice} × {item.quantity} = {item.subtotal} QAR
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* CUSTOMER INFO */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Customer Info</Text>
            <Text style={styles.infoLine}>Name: <Text style={styles.value}>{order.user?.name}</Text></Text>
            <Text style={styles.infoLine}>Email: <Text style={styles.value}>{order.user?.email}</Text></Text>
            <Text style={styles.infoLine}>Phone: <Text style={styles.value}>{order.user?.profile?.phone || 'N/A'}</Text></Text>
          </View>

          {/* SHIPPING */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>
            <Text style={styles.infoLine}>{order.deliveryAddress?.street || 'N/A'}</Text>
            <Text style={styles.infoLine}>{order.deliveryAddress?.city || ''}, {order.deliveryAddress?.country || ''}</Text>
          </View>

          {/* PAYMENT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Info</Text>
            <Text style={styles.infoLine}>Method: <Text style={styles.value}>{order.paymentInfo?.method || 'N/A'}</Text></Text>
            <Text style={styles.infoLine}>Status: <Text style={styles.value}>{order.paymentInfo?.status || 'N/A'}</Text></Text>
            <Text style={styles.infoLine}>Total: <Text style={[styles.value, { color: '#0f172a' }]}>{order.pricing?.totalAmount} QAR</Text></Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  status: { fontSize: wp('4%'), marginTop: hp('1%'), color: '#333' },
  scrollContent: { padding: wp('4%') },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp('4%'),
    paddingVertical: hp('2%'),
    justifyContent: 'space-between',
  },
  title: { fontSize: wp('5.5%'), fontWeight: 'bold', color: '#1e293b' },
  card: {
    backgroundColor: '#fff',
    borderRadius: wp('3%'),
    padding: wp('5%'),
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  section: { marginBottom: hp('2%') },
  label: { fontSize: wp('3.5%'), fontWeight: '600', color: '#6b7280' },
  value: { fontSize: wp('4%'), fontWeight: 'bold', color: '#111827', marginTop: 2 },
  sectionTitle: { fontSize: wp('4.5%'), fontWeight: 'bold', marginBottom: hp('1%'), color: '#111827' },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: hp('0.5%'),
    paddingHorizontal: wp('3%'),
    borderRadius: wp('3%'),
    fontSize: wp('3.5%'),
    fontWeight: '600',
    color: '#fff',
    marginTop: hp('1%'),
  },
  itemRow: { flexDirection: 'row', marginBottom: hp('1.5%'), alignItems: 'center' },
  productImage: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('2%'),
    marginRight: wp('4%'),
    backgroundColor: '#eee',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: wp('4%'), fontWeight: '600', color: '#1f2937' },
  itemQty: { fontSize: wp('3.5%'), color: '#6b7280', marginVertical: hp('0.2%') },
  itemPrice: { fontSize: wp('3.8%'), fontWeight: '500', color: '#0f172a' },
  infoLine: { fontSize: wp('3.8%'), marginBottom: hp('0.6%'), color: '#374151' },
});

export default OrderDetailScreen;
