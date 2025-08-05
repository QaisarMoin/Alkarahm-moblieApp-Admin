import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  I18nManager,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Button } from "react-native-paper";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import apiConfig from "../../api.json";
import AuthContext from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import { API_URL } from "../../api.json";
import jwtDecode from 'jwt-decode';

const AuthScreen = () => {


 

  // OTP state
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  const clearFormFields = () => {
    setName('');
    setPassword('');
    setError(null);
    setOtp('');
    setShowOtpStep(false);
  };

  const navigation: any = useNavigation();
  const authContext = useContext(AuthContext);
  const { t } = useTranslation();

  if (!authContext) {
    return (
      <View>
        <Text>Loading auth context...</Text>
      </View>
    );
  }

  const { loginAction } = authContext;

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);



  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    clearFormFields();
    if (isLoginMode) setEmail('');
  };

  const handleLanguageToggle = async () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    await AsyncStorage.setItem('APP_LANGUAGE', newLang); // <- persist it
    await i18n.changeLanguage(newLang);
  
    const isRTL = newLang === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
     // RNRestart.Restart();
    }
  };
  

  const handleLogin = async () => {
    if (!email || !password) {
      setError(t('auth.requiredLogin'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Request OTP from backend instead of logging in directly
      const response = await axios.post(
        `${API_URL}/auth/send-otp-email`,
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );
      // If backend sends success, show OTP input
      if (response.data.success) {
        setShowOtpStep(true);
        setError(null);
      } else {
        setError(response.data.message || t('auth.loginFailed'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  // Handler for OTP submission
  const handleOtpSubmit = async () => {
    if (!otp) {
      setError(t('auth.otpRequired') || 'OTP is required');
      return;
    }
    setOtpLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_URL}/auth/verify-otp-email`,
        { email, otp },
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (response.data.success) {
        const { user, token } = response.data.data;
        await AsyncStorage.setItem('userId', user._id);
        await AsyncStorage.setItem('userName', user.name);
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
          }
        } catch (locErr) {
          console.log('Location error:', locErr);
        }
        // --- LOCATION LOGIC END ---

        await loginAction({ user, token });
        navigation.navigate('Dashboard');
      } else {
        setError(response.data.message || t('auth.otpFailed'));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.otpFailed'));
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError(t('auth.requiredSignup'));
      return;
    }
   
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${apiConfig.API_URL}/auth/signup`, {
        name,
        email,
        password
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      Alert.alert(t('auth.success'), t('auth.signupSuccess'));
      setName('');
      setPassword('');
      setIsLoginMode(true);
    } catch (err: any) {
      setError(err.response?.data?.message || t('auth.signupFailed'));
    } finally {
      setLoading(false);
    }
  };


  const handleMainAction = () => {
    isLoginMode ? handleLogin() : handleSignup();
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
      if (!userInfo) {
        // User cancelled the sign-in or it failed silently; do nothing
        return;
      }
      const response = await fetch(`${apiConfig.API_URL}/auth/google-signin`, {
        method: 'POST',
        body: JSON.stringify(userInfo),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      const { user, token } = data.data;
      await AsyncStorage.setItem('userId', user._id);
      await AsyncStorage.setItem('userName', user.name);
      await AsyncStorage.setItem('token', token);
      await loginAction({ user, token });
      navigation.navigate('Dashboard');
    } catch (error: any) {
      // Only show alert if error is not due to user cancellation
      if (error.code !== statusCodes.SIGN_IN_CANCELLED && error.message !== 'User cancelled the login flow') {
        console.error("Google Sign-In Error:", error.message);
        Alert.alert("Google Sign-In Failed", error.message || "Try again");
      }
    } finally {
      setIsSigningIn(false);
    }
  };


  const onAppleButtonPress = async () => {
    console.log("yes");
    if (isSigningIn) return;
    setIsSigningIn(true);
    try {
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });
      if (!appleAuthRequestResponse) {
        // User cancelled Apple sign-in
        return;
      }
      console.log(appleAuthRequestResponse);
      const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);
      if (credentialState != appleAuth.State.AUTHORIZED) {
        const { user, email, identityToken } = appleAuthRequestResponse;
        let actualEmail = email;
        if (!actualEmail && identityToken) {
          try {
            const decoded: any = jwtDecode(identityToken);
            actualEmail = decoded.email;
          } catch (e) {
            console.warn("Failed to decode Apple identityToken", e);
          }
        }
        // Now send to backend (example, adapt as needed):
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


  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={handleLanguageToggle} style={{ alignSelf: 'flex-end', marginRight: wp('5%') }}>
          <Text style={{ color: "#303F9F", fontWeight: "bold" }}>
            {i18n.language === 'en' ? 'العربية' : 'English'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          {isLoginMode ? t('auth.loginTitle') : t('auth.signupTitle')}
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Signup-only fields */}
        {!isLoginMode && (
          <>
            <TextInput
              style={styles.input}
              placeholder={t('auth.namePlaceholder')}
              value={name}
              onChangeText={setName}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>

              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={t('auth.phonePlaceholder')}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={text => {
                  setPhone(text);
                }}
                maxLength={8}
                autoCapitalize="none"
              />
            </View>
            {/* Qatar phone validation */}
           {/* {!/^[3567][0-9]{7}$/.test(phone) && phone.length === 8 && (
              <Text style={{ color: 'red', marginBottom: 8 }}>{t('auth.invalidQatarPhone')}</Text>
            )} */}
          </>
        )}
        {/* Email is always shown */}
        <TextInput
          style={styles.input}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          editable={!showOtpStep}
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.passwordPlaceholder')}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!showOtpStep}
        />

        {/* OTP Step UI */}
        {showOtpStep && (
          <>
            <TextInput
              style={styles.input}
              placeholder={t('auth.otpPlaceholder') || 'Enter OTP'}
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
            />
            <Button
              mode="contained"
              style={styles.continueButton}
              labelStyle={styles.continueText}
              onPress={handleOtpSubmit}
              disabled={otpLoading}
            >
              {otpLoading ? <ActivityIndicator color="#fff" /> : t('auth.verifyOtp') || 'Verify OTP'}
            </Button>
          </>
        )}

        {/* Show main action button only if not in OTP step */}
        {!showOtpStep && (
          <Button
            mode="contained"
            style={styles.continueButton}
            labelStyle={styles.continueText}
            onPress={handleMainAction}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : t(isLoginMode ? 'auth.continue' : 'auth.signup')}
          </Button>
        )}

        <TouchableOpacity onPress={toggleMode} style={styles.toggleModeButton}>
          <Text style={styles.toggleModeText}>
            {isLoginMode ? t('auth.toggleToSignup') : t('auth.toggleToLogin')}
          </Text>
        </TouchableOpacity>

        <View style={styles.orContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>{t('auth.or')}</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity style={styles.socialButton} onPress={onGoogleButtonPress} disabled={isSigningIn}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={require('./../../assets/google.png')}
              style={styles.logo}
            />
            <Text style={styles.socialText}>{t('auth.google')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={onAppleButtonPress}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              source={require('./../../assets/apple.png')}
              style={styles.applelogo}
            />
            <Text style={styles.socialText}>{t('auth.apple')}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.footer}>
          {isLoginMode ? t('auth.footerLogin') : t('auth.footerSignup')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// export default AuthScreen;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    paddingHorizontal: wp("5%"),
    paddingVertical: hp("3%"),
    flexGrow: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: wp("6.5%"),
    fontWeight: "700",
    color: "#1A237E",
    marginBottom: hp("4%"), // Increased margin
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: wp("2%"),
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("1.8%"),
    fontSize: wp("4%"),
    color: "#000",
    borderColor: "#ddd",
    borderWidth: 1,
    marginBottom: hp("2%"),
  },
  errorText: {
    color: "red",
    marginBottom: hp("2%"),
    textAlign: "center",
    fontSize: wp("3.5%"),
  },
  continueButton: {
    backgroundColor: "#303F9F",
    borderRadius: wp("2%"),
    paddingVertical: hp("1.2%"),
    marginTop: hp("2%"), // Increased margin
  },
  continueText: {
    fontSize: wp("4.2%"), // Slightly increased font size
    color: "#fff",
    fontWeight: "bold",
  },
  toggleModeButton: {
    marginTop: hp("2.5%"), // Added margin
    alignItems: "center",
  },
  toggleModeText: {
    color: "#303F9F",
    fontSize: wp("3.8%"),
    fontWeight: "600",
  },
  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: hp("2.5%"), // Adjusted margin
  },
  orText: {
    marginHorizontal: wp("3%"),
    color: "#999",
    fontSize: wp("3.5%"),
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ddd",
  },
  socialButton: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: wp("2%"),
    paddingVertical: hp("1.5%"),
    paddingHorizontal: wp("4%"),
    alignItems: "center",
    marginBottom: hp("1.5%"), // Adjusted margin
  },
  socialText: {
    fontSize: wp('4%'),
    marginLeft: wp('3%'),
    color: '#333',
  },
  footer: {
    fontSize: wp("3.2%"),
    color: "#777",
    marginTop: hp("4%"), // Adjusted margin
    lineHeight: hp("2.5%"),
    textAlign: "center",
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
});


