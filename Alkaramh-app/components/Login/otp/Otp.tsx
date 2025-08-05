import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import OTPTextInput from 'react-native-otp-textinput';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../../../api.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthContext from '@/context/AuthContext';



const Otp = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) {
    return (
      <View>
        <Text>Loading auth context...</Text>
      </View>
    );
  }
  const { loginAction } = authContext;
  const { t } = useTranslation();
  const route = useRoute();
  const email = (route.params as any)?.email || '';
  const navigation: any = useNavigation();
  const otpInput = useRef<any>(null);

  const lang = (route.params as any)?.lang || 'English';
  //const t = translations[lang] || translations.English;

  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (timer === 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (code: string) => {
    setOtp(code);
    console.log('OTP Code:', code);
  };

  const handleResend = async () => {
    console.log('Resend Code');
    setTimer(30);
    setCanResend(false);
    
    // Trigger resend OTP API here if needed
    try {
      const response = await fetch(
        `${API_URL}/auth/resend-otp-email`,
        {
          method: 'POST',
          body:JSON.stringify({ "email" : email }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
     
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error resending OTP:", error);
      Alert.alert("Error", "Failed to resend OTP. Please try again.");
    }
  };

  const handleVerify = async () => {
    console.log(otp);
    try {
      const response = await fetch(
        `${API_URL}/auth/verify-otp-email`,
        {
          method: 'POST',
          body:JSON.stringify({ "otp" : otp , "email" : email }),
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = await response.json();
      console.log(data);
      if (!data.success){
        Alert.alert("Error ",data.message);
        return;
      }
      
      const { user, token } = data.data;
      console.log('user',user);
      console.log('token',token);
      await AsyncStorage.setItem('userId', user._id);
      await AsyncStorage.setItem('useremail', user.email);
      await AsyncStorage.setItem('token', token);

      // --- LOCATION LOGIC START ---
      try {
        const Location = await import('expo-location');
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission denied', 'Location permission is required for address services.');
        } else {
          let location = await Location.getCurrentPositionAsync({});
          const { latitude, longitude } = location.coords;
          console.log('User Location:', latitude, longitude);

          let [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
          const addressString = address
            ? `${address.name || ''} ${address.street || ''}, ${address.city || ''}, ${address.region || ''}, ${address.country || ''}, ${address.postalCode || ''}`
            : '';
          await AsyncStorage.setItem('userAddress', addressString);
          await AsyncStorage.setItem('userLat', latitude.toString());
          await AsyncStorage.setItem('userLng', longitude.toString());
          console.log('Address:', addressString);
          // lat/lng are now also stored in userAddresses array per address

          // Update userAddresses array in AsyncStorage
          try {
            const STORAGE_KEY = 'userAddresses';
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            let addresses = stored ? JSON.parse(stored) : [];
            // Create a new address object (structure based on Adressbook.tsx)
            const newAddress = {
              _id: Date.now().toString(),
              street: address.street || '',
              city: address.city || '',
              country: address.country || '',
              lat: latitude,
              lng: longitude,
            };
            // Only add if at least street/city/country is present
            if (newAddress.street || newAddress.city || newAddress.country) {
              // Prevent duplicates (by street/city/country)
              const exists = addresses.some((a: any) => a.street === newAddress.street && a.city === newAddress.city && a.country === newAddress.country);
              if (!exists) {
                addresses.push(newAddress);
                console.log('New address:', newAddress);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
                console.log('Added new address to userAddresses array');
              }
            }
          } catch (e) {
            console.log('Could not update userAddresses array', e);
          }
        }
      } catch (locErr) {
        console.log('Location error:', locErr);
      }
      // --- LOCATION LOGIC END ---

      await loginAction({ user, token });

      navigation.navigate('Dashboard');
    } catch (err: any) {
      console.log(err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.firsttext}>{t("Otp.title")}</Text>
        <Text style={styles.secondtext}>{t("Otp.subtext")}</Text>

        <View style={styles.otpfield}>
          <OTPTextInput
            ref={otpInput}
            handleTextChange={handleChange}
            inputCount={5}
            tintColor="#555"
            offTintColor="#ccc"
            containerStyle={styles.otpContainer}
            textInputStyle={styles.otpbox}
          />
        </View>

        <View style={styles.otresendsection}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.otpresendtext}>{t("Otp.resendCode")}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.timertext}>{t("Otp.resendCode")} {timer}s</Text>
          )}
        </View>
      </View>

      <View style={styles.verifycontainer}>
        <TouchableOpacity style={styles.verifybutton} onPress={handleVerify}>
          <Text style={styles.verifytext}>{t("Otp.verifyCode")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Otp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: wp("5%"),
    backgroundColor: "#fff",
  },
  textContainer: {
    gap: hp("2%"),
    marginTop: hp("7%"),
  },
  firsttext: {
    fontSize: wp("5%"),
    fontWeight: "500",
    color: "#030518",
    textAlign: "left",
  },
  secondtext: {
    fontSize: wp("4%"),
    color: "#555",
    textAlign: "left",
  },
  otpfield: {
    paddingTop: hp("5%"),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  otpContainer: {
    justifyContent: "space-between",
  },
  otpbox: {
    borderWidth: 1,
    borderColor: "#999",
    textAlign: "center",
    fontSize: wp("5.5%"),
    borderRadius: wp("2%"),
    width: wp("12%"),
    height: wp("12%"),
    padding: 0,
    marginHorizontal: wp("1%"),
  },
  otresendsection: {
    marginTop: hp("2%"),
    alignItems: "center",
  },
  otpresendtext: {
    color: "#1A237E",
    fontWeight: "500",
    fontSize: wp("4%"),
    textAlign: "center",
  },
  timertext: {
    color: "#000000",
    fontSize: wp("4%"),
  },
  verifycontainer: {
    marginTop: hp("5%"),
    width: "100%",
  },
  verifybutton: {
    backgroundColor: "#283593",
    paddingVertical: hp("1.8%"),
    borderRadius: wp("3%"),
    alignItems: "center",
    justifyContent: "center",
  },
  verifytext: {
    color: "#FFFFFF",
    fontSize: wp("4.2%"),
    fontWeight: "500",
  },
});
