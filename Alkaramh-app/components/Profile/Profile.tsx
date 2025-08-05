import React, { useState, useContext, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

import ChangePasswordModal from './ChangePasswordModal';
import AuthContext from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import CardContent from 'react-native-paper/lib/typescript/components/Card/CardContent';

const Profile = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const revokeGuestMode = authContext?.revokeGuestMode;
  const { user, logoutAction, token, isGuest } = authContext || {};

  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const storedUser = await AsyncStorage.getItem('user');
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      };
      loadProfile();
    }, [])
  );

  const handleAppUpdate = () => {
    Alert.alert('Check Update', 'Redirecting to App Store or Play Store...');
    const iosAppStoreUrl = 'https://apps.apple.com/sg/app/alkarmh-trading/id6748688076';
    const androidPlayStoreUrl = 'https://play.google.com/store/apps/details?id=com.alkaramh';

    const storeUrl = Platform.OS === 'ios' ? iosAppStoreUrl : androidPlayStoreUrl;
    Linking.openURL(storeUrl);

  }
  
  const guestRestrictionAlert = () => {
    Alert.alert(
      t('profile.guestRestrictedTitle') || 'Guest Restricted',
      t('profile.guestRestrictedMsg') || 'Please login or create an account to access this feature.'
    );
  };

  const handlePersonalInfoPress = () => {
    if (isGuest) return guestRestrictionAlert();
    navigation.navigate('PersonalInfomation');
  };

  const handleNotificationPress = () => {
    if (isGuest) return guestRestrictionAlert();
    navigation.navigate('NotificationScreen');
  };

  const handleOrdersPress = () => {
    if (isGuest) return guestRestrictionAlert();
    navigation.navigate('OrderHistoryScreen');
  };

  const handleAddressBookPress = () => {
    if (isGuest) return guestRestrictionAlert();
    navigation.navigate('AddressBook');
  };

  const getInitialLetter = () => {
    if (isGuest) return 'G';
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const handleLogout = async () => {
    if (isGuest){
      revokeGuestMode();     
      navigation.navigate('Login'); 
      console.log("Guest mode revoked");

      return;
    }
    if (logoutAction) {
      try {
        await logoutAction();
        // Navigation to Login screen might be handled by a root navigator
        // listening to auth state, or can be explicit here.
        navigation.navigate('Login'); 
      } catch (e) {
        console.error("Logout failed", e);
        Alert.alert("Error", "Logout failed. Please try again.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#283593" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>{getInitialLetter()}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
            <Text style={styles.userStatus}>{user?.email || 'Guest@gmail.com'}</Text>
          </View>
        </View>
      </View>

      {/* Scroll Content */}
      <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Account Settings */}
        <View style={styles.card}>
        <View style={styles.CardHead}>
          <View style={styles.cardBar} />
          <Text style={styles.cardTitle}>Account Settings</Text>
          </View>
          <View style={styles.CardContent}>
          <ListItem icon="person-outline" label="Personal Information" onPress={handlePersonalInfoPress} />
          <ListItem icon="notifications-outline" label="Notification Preferences" onPress={handleNotificationPress} />
          </View>
        </View>

        {/* Orders */}
        <View style={styles.card}>
          <View style={styles.CardHead}>
          <View style={styles.cardBar}/>
          <Text style={styles.cardTitle}>Orders</Text>
          </View>
          <View style={styles.CardContent}>
          <ListItem icon="cube-outline" label="Your orders" onPress={handleOrdersPress} />
          <ListItem icon="heart-outline" label="Wishlist" onPress={() => navigation.navigate('WishlistScreen')}  />
          <ListItem icon="map-outline" label="Address book" onPress={handleAddressBookPress} />
          </View>
        </View>
        {/* More */}
        <View style={styles.card}>
          <View style={styles.CardHead}>
          <View style={styles.cardBar}/>
          <Text style={styles.cardTitle}>More</Text>
          </View>
          <View style={styles.CardContent}>
          <ListItem icon="information-circle-outline" label={t('profile.About Us')} onPress={() => Linking.openURL('https://www.alkaramh.com/')} />
         
         <ListItem icon="sync-outline" label={t('profile.Check App Updates')} onPress={handleAppUpdate}/>
         <ListItem icon="help-circle-outline" label={t('profile.Help')} onPress={() => Linking.openURL('https://www.alkaramh.com/contact')}/>
         <ListItem icon="settings-outline" label={t('profile.Settings')} onPress={() => navigation.navigate('LanguageSwitch')} />
         <ListItem icon="log-out-outline" label={t('profile.Logout')} onPress={handleLogout} />
          </View>
        </View>
      </ScrollView>

      <ChangePasswordModal
        visible={isChangePasswordModalVisible}
        onClose={() => setIsChangePasswordModalVisible(false)}
      />
    </View>
  );
};

interface ListItemProps {
  icon: string;
  label: string;
  onPress?: () => void;
  badge?: string;
}

const ListItem: React.FC<ListItemProps> = ({ icon, label, onPress, badge }) => (
  <TouchableOpacity style={styles.item} onPress={onPress} disabled={!onPress}>
    <Icon name={icon} type="ionicon" size={22} color="#000" />
    <Text style={styles.itemText}>{label}</Text>
    {badge && (
      <View style={styles.badgeContainer}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    <Icon name="chevron-forward-outline" type="ionicon" size={22} color="#999" />
  </TouchableOpacity>
);

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FB',
  },
  headerContainer: {
    backgroundColor: '#283593',
    paddingTop: hp('6%'),
    paddingBottom: hp('4%'),
    paddingHorizontal: wp('5%'),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: wp('16%'),
    height: wp('16%'),
    borderRadius: wp('8%'),
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp('4%'),
  },
  avatarLetter: {
    fontSize: wp('7.5%'),
    fontWeight: 'bold',
    color: '#283593',
  },
  headerText: {
    flex: 1,
  },
  userName: {
    fontSize: hp('2.4%'),
    fontWeight: 'bold',
    color: '#fff',
  },
  userStatus: {
    fontSize: hp('2%'),
    color: '#dcdcdc',
  },
  scrollView: {
    padding: wp('5%'),
    paddingBottom: hp('8%'),
  },
  card: {
 
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: hp('2.5%'),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  cardBar: {
    width: wp('1%'),
    height: hp('3.5%'),
    backgroundColor: '#0167FF',
    borderRadius: 2,
    flexDirection:"row",
    marginRight:hp('1%')
  },
  cardTitle: {
    marginLeft:wp('1%'),
    marginTop:hp(".5%"),
    fontSize: hp('2.2%'),
    fontWeight: '600',
 
    color: '#000',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp('2.7%'),
    borderBottomWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  itemText: {
    flex: 1,
    marginLeft: wp('4%'),
    fontSize: hp('2%'),
    color: '#333',
  },
  badgeContainer: {
    backgroundColor: '#FF4C4C',
    borderRadius: 12,
    paddingHorizontal: 6,
    marginRight: wp('2%'),
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: hp('1.5%'),
    fontWeight: 'bold',
  },
  CardContent:{paddingHorizontal:hp('3%'),paddingVertical:hp('2%')},
  CardHead:{flexDirection:"row",marginTop:hp('2%')}
});
