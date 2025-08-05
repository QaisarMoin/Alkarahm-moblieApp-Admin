import React, { useEffect } from 'react';
import { View, Text, StyleSheet, BackHandler, Alert, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import { Home } from './Home';
import Profile from '../Profile/Profile';
import WishlistScreen from '../Profile/WishlistScreen';
import Cart from '../Cart/Cart';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HomeSVGComponent, HeartSVGComponent, CartSVGComponent, ProfileSVGComponent, HomeFillSVGComponent, CartFillSVGComponent, ProfileFillSVGComponent, HeartFillSVGComponent } from './svgs/svgComponents';

const Tab = createBottomTabNavigator();

const BackButton = () => {
  const navigation = useNavigation();
  const isArabic = i18n.language === "ar";
  return (
    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
      <Ionicons         name={isArabic ? "chevron-forward" : "chevron-back"}
 size={24} color="black" />
    </TouchableOpacity>
  );
};

export default function Dashboard() {
  const { t } = useTranslation();
  const isArabic = i18n.language === "ar";
  const route = useRoute();
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        Alert.alert(
          'Exit App',
          'Are you sure you want to quit the app?',
          [
            { text: 'Cancel', onPress: () => null, style: 'cancel' },
            { text: 'Yes', onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: false }
        );
        return true;
      };

      
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => backHandler.remove();
      
    }, [])
  );

  return (
    <Tab.Navigator
  screenOptions={({ route }) => ({
    headerShown: false,
    headerStyle: {
      backgroundColor: '#fff',
    },
    headerTintColor: '#000',
    headerShadowVisible: false,
    headerTitleStyle: { fontWeight: 'bold' },
    headerTitleAlign: 'left',
    tabBarShowLabel: false,
    tabBarItemStyle: {
      paddingLeft: wp('8%'),
      paddingRight: wp('8%'),
    },
    tabBarButton: (props) => (
      <TouchableWithoutFeedback onPress={props.onPress}>
        <View>{props.children}</View>
      </TouchableWithoutFeedback>
    ),
    tabBarStyle: {
      paddingHorizontal:wp('8%'),
      paddingTop: hp('2%'),
      height: hp('10%'),
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#ddd',
    },
    tabBarIcon: ({ focused }) => {
      let IconComponent: any = HomeSVGComponent;
      let label = '';
      const iconColor = focused ? '#2d46eb' : '#A2A2A2';

      switch (route.name) {
        case 'Home':
          IconComponent = focused ? HomeFillSVGComponent : HomeSVGComponent;
          label = t('dashboard.home');
          break;
        case 'Wishlist':
          IconComponent = focused ? HeartFillSVGComponent : HeartSVGComponent;
          label = t('dashboard.wishlist');
          break;
        case 'Cart':
          IconComponent = focused ? CartFillSVGComponent : CartSVGComponent;
          label = t('dashboard.cart');
          break;
        case 'Profile':
          IconComponent = focused ? ProfileFillSVGComponent : ProfileSVGComponent;
          label = t('dashboard.profile');
          break;
      }

      return (
        <View style={[styles.tabItem, focused && styles.activeTab]}>
          <View style={[styles.tabContent, focused && styles.activeContent]}>
            <IconComponent/>
            {focused && <Text style={styles.activeLabel}>{label}</Text>}
          </View>
        </View>
      );
    },
  })}
>

      <Tab.Screen name="Home" component={Home} initialParams={{ showCleared: false }} />
      <Tab.Screen name="Wishlist" component={WishlistScreen}  options={{headerShown: true , headerTitle: t("MyWishlist.title") , headerLeft: () => <BackButton />}}/>
      <Tab.Screen name="Cart" component={Cart} initialParams={{ showEmpty: true }} options={{headerShown: true , headerTitle: t("Cart.title") , headerLeft: () => <BackButton />}}/>
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: hp('40%'),
    width: wp('20%'),
    paddingHorizontal: wp('2%'),
  },
  activeTab: {
    width: wp('25%'),
    height: hp('6%'),
    backgroundColor: '#e8edff',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeLabel: {
    paddingLeft: wp('2%'),
    fontSize: wp("3.5%"),
    color: '#283593',
    fontWeight: '600',
  },
});
