import React, { useEffect, useRef } from 'react';
import { Alert, View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import {
  MFCardPaymentView,
  MFExecutePaymentRequest,
  MFLanguage,
} from 'myfatoorah-reactnative';

interface CardPaymentProps {
  totalAmount: number;
  cardSession: any;
  onPaymentSuccess: () => void;
  onPaymentError: (error: any) => void;
}

const CardPayment: React.FC<CardPaymentProps> = ({ totalAmount, cardSession, onPaymentSuccess, onPaymentError }) => {
  const cardPaymentView = useRef<any>(null);

  // Load the card session into the payment view when available
  useEffect(() => {
    if (cardSession && cardPaymentView.current && typeof cardPaymentView.current.load === 'function') {
      cardPaymentView.current.load(cardSession, (bin: string) => {
        // Optionally handle BIN
        console.log('bin:', bin);
      });
    }
  }, [cardSession]);

  const payWithCard = async () => {
    if (!cardSession) {
      Alert.alert('Payment Error', 'No session. Please place order first.');
      return;
    }
    try {
      const executePaymentRequest = new MFExecutePaymentRequest(totalAmount);
      executePaymentRequest.SessionId = cardSession.SessionId;
      if (cardPaymentView.current && typeof cardPaymentView.current.pay === 'function') {
        await cardPaymentView.current
          .pay(
            executePaymentRequest,
            MFLanguage.ENGLISH,
            (invoiceId: string, redirectUrl?: string, status?: any) => {
              console.log('invoiceId:', invoiceId);
              if (redirectUrl) console.log('redirectUrl:', redirectUrl);
              if (status) console.log('payment status:', status);
            }
          )
          .then((result: any) => {
            console.log('Payment result:', result);
            // Only place the order if authentication is successful
            if (result && (result.status === 'SUCCESS' || result.status === 'PAID' || result.status === 'AUTHENTICATED')) {
              Alert.alert('Payment Success', 'Payment completed successfully!');
              onPaymentSuccess();
            } else {
              Alert.alert('Payment Error', 'Payment authentication failed or incomplete.');
              onPaymentError(result);
            }
          })
          .catch((error: any) => {
            console.log('Payment error:', error);
            Alert.alert('Payment Error', error?.message || 'Payment failed.');
            onPaymentError(error);
          });
      } else {
        Alert.alert('Payment Error', 'Card payment view is not ready.');
      }
    } catch (error: any) {
      Alert.alert('Payment Error', error?.message || 'Failed to execute payment.');
      onPaymentError(error);
    }
  };

  return (
    <View style={styles.cardSection}>
      <MFCardPaymentView ref={cardPaymentView} style={styles.cardPaymentView} />
      <TouchableOpacity style={styles.placeOrderButton} onPress={payWithCard}>
        <Text style={styles.placeOrderText}>Pay</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
  },
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
});

export default CardPayment;
