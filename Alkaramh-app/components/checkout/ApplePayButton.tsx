import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, View, Alert, TouchableOpacity, Text } from 'react-native';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

const {
  MFApplePayButtonView,
  MFApplePayStyle,
  MFExecutePaymentRequest,
  MFCurrencyISO,
  MFLanguage,
} = require('myfatoorah-reactnative');

interface ApplePayButtonProps {
  sessionId: string;
  amount: number;
}

const ApplePayButton: React.FC<ApplePayButtonProps> = ({ sessionId, amount }) => {
  const applePayView = useRef<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const applePayStyle = () => {
    return new MFApplePayStyle(hp('5%'), hp('5%'), 'Buy with', false);
  };

  const handleApplePay = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Build the payment request using props
      const executePaymentRequest = new MFExecutePaymentRequest(amount, 'QAR');
      if (sessionId) {
        executePaymentRequest.SessionId = sessionId;
      }
      executePaymentRequest.DisplayCurrencyIso = 'QAR';
      executePaymentRequest.CurrencyIso = 'QAR';
      executePaymentRequest.displayCurrencyIso = 'QAR';

      console.log('Apple Pay Request:', {
        amount,
        currency: 'QAR',
        sessionId,
        requestObject: JSON.stringify(executePaymentRequest),
      });

      const result = await applePayView.current?.applePayPayment(
        executePaymentRequest,
        MFLanguage.ENGLISH,
        (invoiceId: string) => {
          console.log('Apple Pay Invoice ID:', invoiceId);
        }
      );

      console.log('Apple Pay Success:', result);
      Alert.alert('Success', 'Payment completed successfully!');
    } catch (error: any) {
      console.warn('Apple Pay Error:', error);
      Alert.alert('Payment Error', error?.message || 'Something went wrong during Apple Pay.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.cardSection]}
      onPress={handleApplePay}
      disabled={isProcessing}
      activeOpacity={0.7}
    >
      {Platform.OS === 'ios' && MFApplePayButtonView && (
        <MFApplePayButtonView
          ref={applePayView}
          style={styles.applePayButton}
          applePayButtonStyle={applePayStyle()}
        />
      )}

    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardSection: {
    alignContent: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: wp('90%'),
    height:hp("10%"),
    borderRadius: wp('5%'),
    marginBottom: hp('2%'),
    alignSelf: 'center',
   
  },
  applePayButton: {
    width: '100%',
    marginBottom: hp('1%'),
  },
});

export default ApplePayButton;