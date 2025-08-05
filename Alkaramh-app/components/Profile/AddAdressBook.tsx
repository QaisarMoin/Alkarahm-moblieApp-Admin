import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
const STORAGE_KEY = 'userAddresses';

const AddAddressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const onSave = route.params?.onSave;
  const { t } = useTranslation();
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const getCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed to autofill address.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync(loc.coords);

      if (address.length > 0) {
        const { street, city, country } = address[0];
        setStreet(street || '');
        setCity(city || '');
        setCountry(country || '');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to fetch current location.');
      console.error(error);
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    getCurrentLocation(); // initial autofill
  }, []);

  const saveAddress = async () => {
    if (!street || !city || !country) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const newAddress = {
        _id: Date.now().toString(),
        street,
        city,
        country,
      };

      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const addressList = stored ? JSON.parse(stored) : [];

      const updatedList = [...addressList, newAddress];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

      if (onSave) onSave(); // trigger refresh
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Could not save address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F3F4F8" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.innerContainer}
      >
        {/* Header 
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("manageAddress.add New Address")}</Text>
        </View>
*/}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("manageAddress.Street")}</Text>
          <TextInput
            style={styles.input}
            value={street}
            onChangeText={setStreet}
            placeholder={t("manageAddress.Street")}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("manageAddress.City")}</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder={t("manageAddress.City")}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t("manageAddress.Country")}</Text>
          <TextInput
            style={styles.input}
            value={country}
            onChangeText={setCountry}
            placeholder={t("manageAddress.Country")}
          />
        </View>

        <TouchableOpacity style={styles.locateBtn} onPress={getCurrentLocation}>
          {locating ? (
            <ActivityIndicator color="#2A3B8F" />
          ) : (
            <>
              <Ionicons name="locate-outline" size={20} color="#2A3B8F" />
              <Text style={styles.locateText}>{t("manageAddress.Use My Current Location")}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={saveAddress} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("manageAddress.Save Address")}</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AddAddressScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FB',
  },
  innerContainer: {
    flex: 1,
    padding: wp('5%'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  headerTitle: {
    fontSize: wp('5%'),
    fontWeight: 'bold',
    color: '#333',
    marginLeft: wp('2%'),
  },
  inputGroup: {
    marginBottom: hp('2%'),
  },
  label: {
    fontSize: wp('4%'),
    marginBottom: hp('0.8%'),
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: wp('3%'),
    borderRadius: wp('2%'),
    fontSize: wp('4%'),
    backgroundColor: '#fff',
  },
  locateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp('1%'),
    marginBottom: hp('3%'),
  },
  locateText: {
    color: '#2A3B8F',
    fontSize: wp('4%'),
    marginLeft: wp('2%'),
  },
  button: {
    backgroundColor: '#283593',
    paddingVertical: hp('1.5%'),
    borderRadius: wp('3%'),
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: '600',
  },
});
