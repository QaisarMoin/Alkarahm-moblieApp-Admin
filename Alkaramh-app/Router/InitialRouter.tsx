// InitialRouter.js
import React, { useContext } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Ionicons from "react-native-vector-icons/Ionicons";

// Your screens

import Cart from "../components/Cart/Cart";
import Checkoutpage from "../components/checkout/Checkoutpage";
import { Home } from "../components/Homepage/Home";
//import MobileLoginScreen from "../components/Login/Login";
import Otp from "../components/Login/otp/Otp";
import ProductDetails from "../components/ProductIndetail/View";
import Products from "../components/Products/Products";
import OrderHistoryScreen from "../components/Profile/OrderHistoryScreen";
import Profile from "../components/Profile/Profile";
import WishlistScreen from "../components/Profile/WishlistScreen";
import AuthContext from "../context/AuthContext";
import ProfileScreen from "@/components/Profile/Personalnformation";
import NotificationScreen from "@/components/Homepage/notofication";
import SearchScreen from "@/components/Homepage/Searchpage";
import Dashboard from "@/components/Homepage/Dashboard";
import AboutScreen from "@/components/Profile/AboutScreen";
import AddressBookScreen from "@/components/Profile/Adressbook";
import OrderDetailScreen from "@/components/Profile/OrderDetails";
import ShopProducts from "@/components/Shops/ShopProducts";
import AddAddressScreen from "@/components/Profile/AddAdressBook";
import EditAddressScreen from "@/components/Profile/EditAddressScreen";
import { useTranslation } from "react-i18next";
import AuthScreen from "@/components/Login/LoginWithPhone";
import LanguageSwitch from "@/components/Profile/LanguageSwitch";
import i18n from "@/i18n";
const Stack = createStackNavigator();

// Custom Back Button Component
const BackButton = () => {
  const navigation = useNavigation();
  const isArabic = i18n.language === "ar";
  return (
    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
      <Ionicons  name={isArabic ? "chevron-forward" : "chevron-back"}

      size={24} color="black" />
    </TouchableOpacity>
  );
};

const InitialRouter = () => {
  const authContext = useContext(AuthContext);
  const { user, token, isLoading, isGuest } = authContext || {};
  console.log(isGuest);
  const { t } = useTranslation();
  const isArabic = i18n.language === "ar";
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#2A3B8F" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{
        headerStyle: { backgroundColor: '#ffff' },
        headerTintColor: '#000',
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: 'bold' },
        headerTitleAlign: 'left',
      }}>
        {user && token ? (
          <>
            {/* All screens for logged-in users */}
            <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="WishlistScreen" component={WishlistScreen} options={{ headerShown: true , headerTitle: t("MyWishlist.title") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="Cart" component={Cart} options={{ headerShown: true , headerTitle: t("Cart.title") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="Checkout" component={Checkoutpage} options={{ headerShown: true , headerTitle: t("Checkout.title") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
            <Stack.Screen name="Products" component={Products} options={{ headerShown: false }} />
            <Stack.Screen name="ProductIndetail" component={ProductDetails} options={{ headerShown: true , headerTitle: t('ProductInfo.title') , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="OrderHistoryScreen" component={OrderHistoryScreen} options={{ headerShown: true , headerTitle: t("profile.Order History") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="SearchScreen" component={SearchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{ headerShown: true , headerTitle: t("Notification.title") , headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="ProductDetails" component={ProductDetails} options={{ headerShown: false }} />
            <Stack.Screen name="AboutScreen" component={AboutScreen} options={{ headerShown: true, headerTitle: "About Us", headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="PersonalInfomation" component={ProfileScreen} options={{ headerShown: true , headerTitle: t("profile.profile") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="AddressBook" component={AddressBookScreen} options={{ headerShown: true, headerTitle: t("manageAddress.My Address Book"), headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="OrderDetails" component={OrderDetailScreen} options={{ headerShown: true, headerTitle: t("profile.Order Summary"), headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="ShopProductsScreen" component={ShopProducts} options={{headerShown: false}} />
            <Stack.Screen name="AddAddressScreen" component={AddAddressScreen} options={{ headerShown: true, headerTitle: t("manageAddress.add New Address"), headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="EditAddressScreen" component={EditAddressScreen} options={{ headerShown: true, headerTitle: t("manageAddress.edit Address"), headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="LanguageSwitch" component={LanguageSwitch} options={{ headerShown: true , headerTitle: t("LanguageSwitch.title") , headerLeft: () => <BackButton />}} />
          </>
        ) : isGuest ? (
          <>
            {/* Screens accessible to guest users only */}
            <Stack.Screen name="Dashboard" component={Dashboard} options={{ headerShown: false }} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="WishlistScreen" component={WishlistScreen} options={{ headerShown: true , headerTitle: t("MyWishlist.title") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="Cart" component={Cart} options={{ headerShown: true , headerTitle: t("Cart.title") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="Checkout" component={Checkoutpage} options={{ headerShown: true , headerTitle: t("Checkout.title") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
            <Stack.Screen name="Products" component={Products} options={{ headerShown: false }} />
            <Stack.Screen name="ProductIndetail" component={ProductDetails} options={{ headerShown: true , headerTitle: t('ProductInfo.title') , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="OrderHistoryScreen" component={OrderHistoryScreen} options={{ headerShown: true , headerTitle: t("profile.Order History") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="SearchScreen" component={SearchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="NotificationScreen" component={NotificationScreen} options={{ headerShown: true , headerTitle: t("Notification.title") , headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="ProductDetails" component={ProductDetails} options={{ headerShown: false }} />
            <Stack.Screen name="AboutScreen" component={AboutScreen} options={{ headerShown: true, headerTitle: "About Us", headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="PersonalInfomation" component={ProfileScreen} options={{ headerShown: true , headerTitle: t("profile.profile") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="AddressBook" component={AddressBookScreen} options={{ headerShown: true, headerTitle: t("manageAddress.My Address Book"), headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="OrderDetails" component={OrderDetailScreen} options={{ headerShown: true, headerTitle: t("profile.Order Summary"), headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="ShopProductsScreen" component={ShopProducts} options={{headerShown: false}} />
            <Stack.Screen name="AddAddressScreen" component={AddAddressScreen} options={{ headerShown: true, headerTitle: t("manageAddress.add New Address"), headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="EditAddressScreen" component={EditAddressScreen} options={{ headerShown: true, headerTitle: t("manageAddress.edit Address"), headerLeft: () => <BackButton /> }} />
            <Stack.Screen name="LanguageSwitch" component={LanguageSwitch} options={{ headerShown: true , headerTitle: t("LanguageSwitch.title") , headerLeft: () => <BackButton />}} />
            <Stack.Screen name="Login" component={AuthScreen}options={{headerShown: false}}/>
         {/* Add any other non-sensitive screens for guests here */}
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={AuthScreen} options={{headerShown: false}}/>
            <Stack.Screen name="otp" component={Otp} options={{headerShown: false}}/>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default InitialRouter;
