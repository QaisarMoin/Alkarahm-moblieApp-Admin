import { useNavigation, useRoute } from '@react-navigation/native';
import {
  MFCardPaymentView,
  MFCountry,
  MFEnvironment,
  MFExecutePaymentRequest,
  MFInitiateSessionRequest,
  MFLanguage,
  MFSDK,
  MFApplePayButtonView,
  MFApplePayStyle
} from 'myfatoorah-reactnative';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { API_URL } from '../../api.json';

import AuthContext from '../../context/AuthContext';
import ApplePayButton from './ApplePayButton';

const Checkoutpage = () => {
  const authContext = React.useContext(AuthContext);
  const user = authContext?.user;
  const applePayViewRef = useRef<MFApplePayButtonView>(null);
  let applePayView: MFApplePayButtonView | null = null;
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const { selectedItems, address:location, userId } = route.params;
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [cardSession, setCardSession] = useState<any>(null);
  const cardPaymentView = useRef<any>(null);
  const [deliveryFee, setDeliveryFee] = useState(50);
  const [shopCoords, setShopCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const applePayStyle = () => {
    return new MFApplePayStyle(30, 30, 'Buy with', false);
  };
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
React.useEffect(() => {
  const fetchShopCoords = async () => {
    const shopId = selectedItems[0]?.product?.shop;
    if (!shopId || !location?.lat || !location?.lng) return;

    try {
      const res = await fetch(`${API_URL}/shops/${shopId}`);
      const data = await res.json();

      if (data.success && data.data.address?.coordinates?.latitude && data.data.address.coordinates?.longitude) {
        setShopCoords({
          latitude: data.data.address.coordinates.latitude,
          longitude: data.data.address.coordinates.longitude,
        });

        const dist = haversineDistance(
          location.lat,
          location.lng,
          data.data.address.coordinates.latitude,
          data.data.address.coordinates.longitude
        );
        setDistance(dist);

        let fee = 50;
        if (dist > 5) {
          fee += Math.ceil(dist - 5) * 10;
        }
        setDeliveryFee(Math.round(fee));
      }
    } catch (e) {
      console.error('Failed to fetch shop coordinates:', e);
    }
  };
  fetchShopCoords();
}, [selectedItems, location]);

  const subtotal = selectedItems.reduce(
    (acc: number, item: any) => acc + item.price * item.quantity,
    0
  );

  const totalAmount = subtotal + deliveryFee;

  useEffect(() => {
    MFSDK.init(
      'NxSlBmOSqB2iPyXg-xGkiWXXAE9hwEuX96m-0CZYEDh006OXr4SzZVv12OTqB8OVNzZKISbBV4u9c3aRqaodzIN996WM86JMpOk6u2avMXTZfQs2QsSrN6HaH50djX4y3x3NWeKbYmGf8RskmMLdXBRr7Q-lNVg0tN3rEl0hXbLBAyZ89fHSxSh4o0YustvaKoBxb2YJkdNzEL5Az-KMzwvHFa_EJ7mB4hnAmaDaNQLH90bbC-h0G17X-FNiWzVgMZRsbwSj3enaGfk35ufR4byXtPz125WhBYD1cxrrxT_6p2G5_YxcmVkyy7dGvsOxPmxHGgB2M_5cLwKUz0466GlYoVp3hPEnendy1RlR1_BFEqW1VRiR3Ip59rgf-NrRTXh9uHrqCAjK1BBZsDWJXAIy1eezdcRJvTtOJ519BP5sYQWgob1SrreILjsHk5h67uYrw6gXVry3qyTPpy7TUxX9vIsUKilQ5tuogbOi-6g9UAXviWuHVufipszVT0KAJPFh3hN51woAAkUUPicmZN4geGA4CT4wgQHlIpsx1-JUcCRHDDRFHIagNfkdCkzn0OOcqJtEmFf_Nb0LlgEjhJD_qJZDeXiNP6hzAxpXBOh-eOKfXbyyE4URs7C2zPy1Blw5ZUkUmMGMY1KD093W8lEpC0gQmv7zoU0COJD2QJhL_xAm_2QERw_wOA3AjwOcJiko0MVV0iLw4B-jD16k6HSH2m3my6iA64DbrB1enwc-kHM-jAmlYCStBQjFmGvYEMM9tw'
      ,MFCountry.QATAR,
      MFEnvironment.LIVE
    );
  }, []);

  const handleUnifiedOrder = async () => {
    console.log("Yes");
    // Require phone number in user profile
    if (!user?.phone && !user?.profile?.phone) {
      Alert.alert(
        'Phone Number Required',
        'Please update your profile with a valid mobile number to place the order.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Profile',
            onPress: () => navigation.navigate('PersonalInfomation'),
          },
        ]
      );
      return;
    }
    if (!selectedItems || selectedItems.length === 0) {
      Alert.alert('Error', 'No items selected.');
      return;
    }
    const shopId = selectedItems[0].product.shop;
    const items = selectedItems.map((item: any) => ({
      product: item.product._id,
      variant: item.variant,
      quantity: item.quantity,
      unitPrice: item.price,
      subtotal: item.price * item.quantity,
      variantSnapshot: {
        name: {
          en: item.product.name.en,
          ar: item.product.name.ar || '',
        },
        price: item.price,
      },
    }));
    const payload = {
      user: userId,
      shop: shopId,
      deliveryAddress: {
        country: location.country,
        city: location.city,
        street: location.street,
      },
      items: items,
      pricing: {
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        totalAmount: totalAmount
      }
    };
    try {
      const response = await fetch(`${API_URL}/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      console.log(response);
      const result = await response.json();
      console.log(result);
      if (result.message) {
        await fetch(`${API_URL}/cart/clear`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userId }),
        });
        Alert.alert('Success', result.message);
        navigation.navigate('Dashboard');
      } else {
        Alert.alert('Error', result.message || 'Failed to place order.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while placing the order.');
    }
  };

  const payWithCard = async () => {
     // Require phone number in user profile
   
    if (!cardSession) {
      Alert.alert('Payment Error', 'No session. Please place order first.');
      return;
    }
    try {
      const executePaymentRequest = new MFExecutePaymentRequest(totalAmount);
      executePaymentRequest.SessionId = cardSession.SessionId;

      await cardPaymentView.current
        ?.pay(
          executePaymentRequest,
          MFLanguage.ENGLISH,
          async (invoiceId: string) => {
            console.log('invoiceId:', invoiceId);

        
           
            // Place order after successful payment
            const shopId = selectedItems[0].product.shop;
            const items = selectedItems.map((item: any) => ({
              product: item.product._id,
              variant: item.variant,
              quantity: item.quantity,
              unitPrice: item.price,
              subtotal: item.price * item.quantity,
              variantSnapshot: {
                name: {
                  en: item.product.name.en,
                  ar: item.product.name.ar || '',
                },
                price: item.price,
              },
            }));
            const payload = {
              user: userId,
              shop: shopId,
              deliveryAddress: {
                country: location.country,
                city: location.city,
                street: location.street,
              },
              items: items,
              pricing: {
                subtotal: subtotal,
                totalAmount: totalAmount,
              },
           paymentInfo:{
            method:"card",
            status:"paid",
            transctionId:invoiceId
           }
            };
            console.log(payload);
            try {
              const response = await fetch(`${API_URL}/orders/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const result = await response.json();
              console.log(result);
              if (result.message) {
                await fetch(`${API_URL}/cart/clear`, {
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: userId }),
                });
                Alert.alert('Success', 'Payment successful and order placed!');
                navigation.navigate('Dashboard');
              } else {
                Alert.alert('Error', result.message || 'Order placement failed.');
              }
            } catch (error) {
              Alert.alert('Error', 'Payment done but order placement failed.');
            }
          }
        )
        .catch((error: any) => {
          Alert.alert('Payment Error', error?.message || 'Payment failed.');
        });
    } catch (error: any) {
      Alert.alert('Payment Error', error?.message || 'Failed to execute payment.');
    }
  };

  const initiateCardSession = async () => {
    if (!user?.phone && !user?.profile?.phone) {
      Alert.alert(
        'Phone Number Required',
        'Please update your profile with a valid mobile number to place the order.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go to Profile',
            onPress: () => navigation.navigate('PersonalInfomation'),
          },
        ]
      );
      return;
    }
    try {
      const req = new MFInitiateSessionRequest(`${user?.phone || user?.profile?.phone}`);
      const res = await MFSDK.initiateSession(req);
      setCardSession(res);
      setTimeout(async () => {
        await cardPaymentView.current?.load(res, (bin: string) =>
          console.log('bin: ' + bin)
        );
      }, 100);
      Alert.alert('Payment', 'Session initiated. Please enter card details.');
    } catch (error: any) {
      Alert.alert('Payment Errors', error?.message || 'Failed to initiate session.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFF" />
      <View style={styles.content}>
        <View style={styles.section}>
          <View style={styles.paymentOptions}>
            <View style={styles.sectionHeader}>
              <View style={styles.blueLine} />
              <Text style={styles.sectionTitle}>{t('Checkout.Pay with')}</Text>
            </View>
            {['debit', 'credit', 'cash','applepay'].map((method) => (
              <TouchableOpacity
                key={method}
                style={styles.paymentOption}
                onPress={() => setSelectedPayment(method)}
              >
                <View style={styles.paymentOptionLeft}>
                  {method === 'cash' ? (
                    <Image
                      style={styles.paymentIconImage}
                      source={require('../../assets/Vector.png')}
                    />
                  ) : (
                    <FontAwesome style={styles.paymentIcon} name="credit-card" />
                  )}
                  <Text style={styles.paymentLabel}>
                    {method === 'debit'
                      ? t('Checkout.debit card')
                      : method === 'credit'
                      ? t('Checkout.credit card')
                      : method === 'cash'
                      ? t('Checkout.cash on delivery')
                      : t('Checkout.apple pay')}
                  </Text>
                </View>
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radioButton,
                      selectedPayment === method && styles.radioButtonSelected,
                    ]}
                  >
                    {selectedPayment === method && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.priceDetails}>
            <View style={styles.sectionHeader}>
              <View style={styles.blueLine} />
              <Text style={styles.sectionTitle}>{t('Checkout.Price Details')}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('Checkout.Basket Total')}</Text>
              <Text style={styles.priceValue}>{subtotal} QAR</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('Checkout.Delivery Fee')}</Text>
              <Text style={styles.priceValue}>{deliveryFee} QAR</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>{t('Checkout.Total')}</Text>
              <Text style={styles.totalValue}>{totalAmount} QAR</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {selectedPayment === 'cash' && (
          <TouchableOpacity style={styles.placeOrderButton} onPress={handleUnifiedOrder}>
            <Text style={styles.placeOrderText}>Place Order</Text>
          </TouchableOpacity>
        )}
        {selectedPayment !== 'cash' && !cardSession && (
          <TouchableOpacity style={styles.placeOrderButton} onPress={initiateCardSession}>
            <Text style={styles.placeOrderText}>Proceed to Card Payment</Text>
          </TouchableOpacity>
        )}
      </View>

      {selectedPayment === 'applepay' && cardSession && (
        <ApplePayButton sessionId={cardSession.SessionId} amount={totalAmount} />
      )}
      {selectedPayment !== 'cash' && selectedPayment !== 'applepay' && cardSession && (
        <View style={styles.cardSection}>
          <MFCardPaymentView ref={cardPaymentView} style={styles.cardPaymentView} />
          <TouchableOpacity style={styles.placeOrderButton} onPress={payWithCard}>
            <Text style={styles.placeOrderText}>Pay</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  content: { flex: 1, paddingHorizontal: wp('5%') },
  section: { marginTop: hp('2.5%') },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: hp('2%'), paddingTop: hp('2%') },
  blueLine: { width: wp('1.2%'), height: hp('2.5%'), backgroundColor: '#283593', marginRight: wp('3%'), borderRadius: 2 },
  sectionTitle: { fontSize: wp('4.5%'), fontWeight: '600', color: '#283593' },
  paymentOptions: { backgroundColor: '#ffffff', borderRadius: wp('3%'), paddingVertical: hp('1%') },
  paymentOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: wp('4%'), paddingVertical: hp('2.5%'), borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  paymentOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  paymentIcon: { fontSize: wp('5.5%'), marginRight: wp('3%'), color: '#333' },
  paymentIconImage: { width: wp('5.5%'), height: wp('5.5%'), resizeMode: 'contain', marginRight: wp('3%') },
  paymentLabel: { fontSize: wp('4.2%'), color: '#333333', fontWeight: '400' },
  radioContainer: { padding: wp('1%') },
  radioButton: { width: wp('5%'), height: wp('5%'), borderRadius: wp('2.5%'), borderWidth: 2, borderColor: '#d1d5db', alignItems: 'center', justifyContent: 'center' },
  radioButtonSelected: { borderColor: '#283593' },
  radioButtonInner: { width: wp('2.5%'), height: wp('2.5%'), borderRadius: wp('1.25%'), backgroundColor: '#283593' },
  priceDetails: { backgroundColor: '#ffffff', borderRadius: wp('3%'), paddingHorizontal: wp('4%'), paddingVertical: hp('2%') },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: hp('1.5%') },
  priceLabel: { fontSize: wp('4%'), color: '#6b7280', fontWeight: '400' },
  priceValue: { fontSize: wp('4%'), color: '#333333', fontWeight: '500' },
  separator: { height: 1, backgroundColor: '#f0f0f0', marginVertical: hp('1%') },
  totalLabel: { fontSize: wp('4.2%'), color: '#333333', fontWeight: '600' },
  totalValue: { fontSize: wp('4.2%'), color: '#333333', fontWeight: '600' },
  buttonContainer: { paddingHorizontal: wp('5%'), paddingVertical: hp('2.5%') },
  placeOrderButton: {
    backgroundColor: '#283593',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 4,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#283593',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 2,
  },
  placeOrderText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
    width: '92%',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontSize: 30,
  },
  cardPaymentView: {
    width: '100%',
    height: 320,
    marginBottom: 24,
    borderRadius: 14,
    backgroundColor: '#f6f8fa',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e3e6ed',
    // fontSize: 20,
  },
});

export default Checkoutpage;