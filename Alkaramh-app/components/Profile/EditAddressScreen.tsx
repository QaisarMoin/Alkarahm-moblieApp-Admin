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
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
const STORAGE_KEY = 'userAddresses';

const EditAddressScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const address = route.params?.address;
  const { t } = useTranslation();
  const [street, setStreet] = useState(address?.street || '');
  const [city, setCity] = useState(address?.city || '');
  const [country, setCountry] = useState(address?.country || '');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const updateLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is needed to autofill address.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const reverse = await Location.reverseGeocodeAsync(location.coords);

      if (reverse.length > 0) {
        const { street, city, country } = reverse[0];
        setStreet(street || '');
        setCity(city || '');
        setCountry(country || '');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not fetch your location.');
    } finally {
      setLocating(false);
    }
  };

  const handleUpdate = async () => {
    if (!street || !city || !country) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const addresses = stored ? JSON.parse(stored) : [];

      const updated = addresses.map((addr) =>
        addr._id === address._id ? { ...addr, street, city, country } : addr
      );

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to update address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.innerContainer}
      >
        {/* Header 
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("manageAddress.edit Address")}</Text>
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

        <TouchableOpacity style={styles.locateBtn} onPress={updateLocation}>
          {locating ? (
            <ActivityIndicator color="#2A3B8F" />
          ) : (
            <>
              <Ionicons name="locate-outline" size={20} color="#2A3B8F" />
              <Text style={styles.locateText}>{t("manageAddress.Use My Current Location")}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t("manageAddress.Update Address")}</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EditAddressScreen;

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
