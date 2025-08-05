import React, { useEffect, useState, useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import AuthContext from '@/context/AuthContext';
import { useTranslation } from 'react-i18next';

interface Address {
  _id: string;
  street: string;
  city: string;
  country: string;
}

const STORAGE_KEY = 'userAddresses';

const AddressBookScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useContext(AuthContext);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAddressesFromStorage = async () => {
    setLoading(true);
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: Address[] = JSON.parse(data);
        setAddresses(parsed);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load addresses from storage');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadAddressesFromStorage();
    }, [])
  );

  const saveAddressesToStorage = async (data: Address[]) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  };

  const handleDelete = (id: string) => {
    Alert.alert(t("manageAddress.Confirm"), t("manageAddress.Are you sure you want to delete this address?"), [
      { text: t("manageAddress.Cancel"), style: 'cancel' },
      {
        text: t("manageAddress.Delete"),
        style: 'destructive',
        onPress: async () => {
          const updated = addresses.filter((addr) => addr._id !== id);
          setAddresses(updated);
          await saveAddressesToStorage(updated);
        },
      },
    ]);
  };

  const renderAddress = ({ item }: { item: Address }) => (
    <View style={styles.addressCard}>
      <Text style={styles.addressText}>
        {item.street}, {item.city}, {item.country}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => navigation.navigate('EditAddressScreen', { address: item })}>
          <Ionicons name="create-outline" size={22} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item._id)}>
          <Ionicons name="trash-outline" size={22} color="#FF5252" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F3F4F8" />

      {loading ? (
        <ActivityIndicator style={{ marginTop: hp('4%') }} size="large" color="#283593" />
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item._id}
          renderItem={renderAddress}
          contentContainerStyle={{ paddingHorizontal: wp('5%'), paddingBottom: 80 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: hp('5%'), color: '#777' }}>
              {t("manageAddress.No addresses found")}
            </Text>
          }
        />
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddAddressScreen')}
      >
        <Text style={styles.addButtonText}>{t("manageAddress.add New Address")}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default AddressBookScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FB',
  },
  addressCard: {
    backgroundColor: '#fff',
    padding: wp('4%'),
    borderRadius: wp('3%'),
    marginVertical: hp('1%'),
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addressText: {
    fontSize: wp('4%'),
    color: '#333',
    flex: 1,
    paddingRight: 10,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addButton: {
    backgroundColor: '#283593',
    margin: wp('5%'),
    borderRadius: wp('3%'),
    paddingVertical: hp('1.8%'),
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: wp('4.5%'),
    fontWeight: '600',
  },
});
