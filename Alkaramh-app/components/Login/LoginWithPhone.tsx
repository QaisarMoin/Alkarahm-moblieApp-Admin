import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  I18nManager,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import AuthContext from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { API_URL } from "../../api.json";
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {appleAuth} from '@invertase/react-native-apple-authentication';// Import Firebase config (make sure this is imported early)
import jwtDecode from "jwt-decode";

const AuthScreen = () => {
  const authContext = useContext(AuthContext);
  const { invokeGuestMode } = useContext(AuthContext);
  if (!authContext) {
    return (
      <View>
        <Text>Loading auth context...</Text>
      </View>
    );
  }
  
  const [isSigningIn, setIsSigningIn] = useState(false);
  const { loginAction } = authContext;
  const { t } = useTranslation();
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState('');
  const navigation: any = useNavigation();
  const [language, setLanguage] = useState<'English' | 'Arabic'>('Arabic');

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: '825727174745-1i36vpgg0jlo3gfv00nei0fird3sm6qj.apps.googleusercontent.com',
    });
  }, []);

  const Handleotp = () => {
    setIsLoginMode(true);
    navigation.navigate("otp");
    setIsLoading(false);
  };

  const handleLanguageToggle = async () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    await AsyncStorage.setItem('APP_LANGUAGE', newLang);
    await i18n.changeLanguage(newLang);

    const isRTL = newLang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
    }
  };

  const handleSendOtp = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    console.log("Sending OTP");
    console.log(email);
    console.log({ "email": email.toLocaleLowerCase() });
    
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/send-otp-email`, {
        method: 'POST',
        body: JSON.stringify({ "email": email.toLocaleLowerCase() }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log(response);
      const data = await response.json();
      console.log(data);
      if (response.status === 200) {
        setIsLoginMode(true);
        navigation.navigate("otp", { 'email': email.toLocaleLowerCase() });
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogleButtonPress = async () => {
    if (isSigningIn) return;

    setIsSigningIn(true);

    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const currentUser = await GoogleSignin.getCurrentUser();
      if (currentUser) {
        await GoogleSignin.signOut();
      }

      const userInfo = await GoogleSignin.signIn();
      
      if (userInfo) {
        const response = await fetch(`${API_URL}/auth/google-signin`, {
          method: 'POST',
          body: JSON.stringify(userInfo),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('data', data);
        const { user, token } = data.data;

        await AsyncStorage.setItem('userId', user._id);
        await AsyncStorage.setItem('userName', user.name);
        await AsyncStorage.setItem('token', token);

        await loginAction({ user, token });
        handlelocation();
        navigation.navigate('Dashboard');
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error.message);
      Alert.alert("Google Sign-In Failed", error.message || "Try again");
    } finally {
      setIsSigningIn(false);
    }
  };

  const onAppeButtonPress = async () => {
    console.log("yes");
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      })
      if (!appleAuthRequestResponse) {
        // User cancelled Apple sign-in
        return;
      }
   
      const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);
      if (credentialState != appleAuth.State.AUTHORIZED) {
        const { user, email, identityToken } = appleAuthRequestResponse;
        if (!identityToken) {
          Alert.alert("Apple Sign-In Failed", "Failed to get identity token");
          return;
        }
        const decoded = jwtDecode(identityToken);
        console.log(decoded);

        let actualEmail = email;
        
        try {

          const response = await fetch(`${API_URL}/auth/apple`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identityToken,
              user: { email: actualEmail, name: "Apple User" },
            }),
          });
          console.log(response);
          const data = await response.json();
          if (data.success) {
            const { user, token } = data.data;
            await AsyncStorage.setItem('userId', user._id);
            await AsyncStorage.setItem('userName', user.name);
            await AsyncStorage.setItem('token', token);
            await loginAction({ user, token });
            navigation.navigate('Dashboard');
          } else {
            Alert.alert("Apple Sign-In Failed", data.message || "Try again");
          }
        } catch (error: any) {
          Alert.alert("Apple Sign-In Failed", error?.message || "Try again");
        } finally {
          setIsSigningIn(false);
        
        }
        
      }
    } catch (error: any) {
      // Only show alert if error is not due to user cancellation
      if (!error.message?.includes('cancelled')) {
        console.error("Apple Sign-In Error:", error.message);
        Alert.alert("Apple Sign-In Failed", error.message || "Try again");
      }
    } finally {
      setIsSigningIn(false);
    }
  };
  
  const onAppleButtonPress = async () => {
    console.log("yes");
    if (isSigningIn) return;
    setIsSigningIn(true);
    const appleAuthRequestResponse = await appleAuth.performRequest({
      requestedScopes: [
        appleAuth.Scope.FULL_NAME,
        appleAuth.Scope.EMAIL,
      ],
      requestedOperation: appleAuth.Operation.LOGIN,
    });
  
    const { identityToken, user, email, fullName } = appleAuthRequestResponse;
    console.log("identityToken", identityToken);
    console.log("user", user);
    console.log("email", email);
    console.log("fullName", fullName);
    try{
      console.log("yes");
      const res = await fetch(`${API_URL}/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityToken,
         
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        const { user, token } = data.data;
        await AsyncStorage.setItem('userId', user._id);
        await AsyncStorage.setItem('userName', user.name);
        await AsyncStorage.setItem('token', token);
        await loginAction({ user, token });
        handlelocation();
        navigation.navigate('Dashboard');
      } else {
        Alert.alert("Apple Sign-In Failed", data.message || "Try again");
      }
    } catch (error: any) {
      Alert.alert("Apple Sign-In Failed", error?.message || "Try again");
    } finally {
      setIsSigningIn(false);
    }
  };

const handlelocation = async () =>{
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
}
  return (
    <View style={styless.container}>
      
      <TouchableOpacity onPress={handleLanguageToggle} style={styless.langSwitch}>
        <Text style={styless.langText}>{t("LoginWithPhone.switchLang")}</Text>
      </TouchableOpacity>

      <Text style={styless.title}>{t("LoginWithPhone.title")}</Text>

      <View style={styless.inputRow}>
       
        <TextInput
          style={styless.input}
          placeholder={t("LoginWithPhone.placeholder")}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={handleSendOtp}
          maxLength={254}
        />
      </View>

      <Text style={styless.subtext}>{t("LoginWithPhone.subtext")}</Text>

      <Button
        mode="contained"
        style={styless.continueButton}
        onPress={handleSendOtp}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          t("LoginWithPhone.continue")
        )}
      </Button>

      <View style={styless.orContainer}>
        <View style={styless.line} />
        <Text style={styless.orText}>{t("LoginWithPhone.or")}</Text>
        <View style={styless.line} />
      </View>

      <TouchableOpacity style={styless.socialButton} onPress={onGoogleButtonPress}>
        <Image
          source={require('./../../assets/google.png')}
          style={styless.logo}
        />
        <Text style={styless.socialText}>{t("LoginWithPhone.google")}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styless.socialButton} onPress={onAppleButtonPress}>
        <Image
          source={require('./../../assets/apple.png')}
          style={styless.applelogo}
        />
        <Text style={styless.socialText}>{t("LoginWithPhone.apple")}</Text>
      </TouchableOpacity>
      <TouchableOpacity
  style={[styless.socialButton]}
  onPress={async () => {
    await AsyncStorage.removeItem('userId');
    await AsyncStorage.removeItem('userName');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.setItem('guestMode', 'true');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('userToken');
    await invokeGuestMode();
    if (authContext) {
      authContext.logoutAction?.(); // Clear any user state
    }
    navigation.navigate('Dashboard');
  }}
>
  <Text style={[styless.socialText, { color: '#333' }]}>
    {t('LoginWithPhone.skipForNow') || 'Skip for Now'}
  </Text>
</TouchableOpacity>
      <Text style={styless.footer}>{t("LoginWithPhone.footer")}</Text>
    </View>
  );
};


export default AuthScreen;

const styless = StyleSheet.create({
  container: {
    paddingHorizontal: wp("5%"),
    paddingTop: hp("5%"),
    backgroundColor: "#fff",
    height: hp("100%"),
  },
  langSwitch: {
    alignSelf: 'flex-end',
    marginTop: hp("1%"),
  },
  langText: {
    padding: wp('2%'),
    borderRadius: wp("2%"),
    borderWidth: 1,
    fontSize: wp("3.8%"),
    color: '#1A237E',
  },
  title: {
    fontSize: wp("7%"),
    marginTop: hp("6%"),
    fontWeight: "500",
    color: "#1A237E",
    marginBottom: hp("4%"),
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp("2%"),
  },
  codeBox: {
    padding: wp("2%"),
    borderWidth: 1,
    borderRadius: wp("2%"),
    borderColor: "#ccc",
    marginRight: wp("2%"),
  },
  codeText: {
    fontSize: wp("4%"),
    color: "#1A237E",
  },
  input: {
    flex: 1,
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("3%"),
    fontSize: wp("4%"),
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: wp("2%"),
    color: "#000",
  },
  subtext: {
    fontSize: wp("3.5%"),
    color: "#888",
    marginBottom: hp("2%"),
  },
  continueButton: {
    backgroundColor: "#303F9F",
    paddingVertical: hp("1.5%"),
    borderRadius: wp("2%"),
    marginBottom: hp("3%"),
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp("2%"),
  },
  orText: {
    marginHorizontal: wp("3%"),
    color: "#aaa",
    fontSize: wp("3.5%"),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'center',
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: wp("2%"),
    paddingVertical: hp("1.5%"),
    marginBottom: hp("2%"),
  },
  logo: {
    width: wp('6%'),
    height: wp('6%'),
    resizeMode: 'contain',
  },
  applelogo: {
    width: wp('8%'),
    height: wp('8%'),
    resizeMode: 'contain',
  },
  socialText: {
    fontSize: wp("4%"),
    marginLeft: wp("3%"),
  },
  footer: {
    fontSize: wp("3%"),
    color: "#888",
    marginTop: hp("5%"),
    textAlign: "center",
  },
});