import Footer from "@/Utils/Footer/Footer";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect } from "react";
import {
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Cartstyles as styles } from "./CartStyleSheet";
import { useTranslation } from "react-i18next";
import AuthContext from "@/context/AuthContext";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";

const EmptyCart = () => {
  const { t } = useTranslation();
  const navigation: any = useNavigation();
  const context = useContext(AuthContext);
  const isGuest = context?.isGuest ?? true;

  useEffect(() => {
   
  }, [isGuest]);

  return (
    <View style={styles.emptyCartContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FB" />

    {isGuest ? (
      <View style={styles.centeredView}>
        <Ionicons name="lock-closed-outline" size={wp('20%')} color="#ccc" />
        <Text style={styles.errorText}>
          {t('profile.guestRestrictedMsg') || 'Please login or create an account to access this feature.'}
        </Text>
      </View>
    ) : ( 
        <View style={styles.emptyCartCard}>
          <Image
            source={require("../../assets/cart_man.png")}
            style={styles.emptyCartImage}
          />
          <Text style={styles.emptyCartTitle}>
            {t("Cart.empty", "Your Cart is Empty")}
          </Text>
          <Text style={styles.emptyCartSubtitle}>
            {t("Cart.Looks")}
          </Text>
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.exploreButtonText}>
              {t("Cart.Explore Now")}
            </Text>
          </TouchableOpacity>
        </View>
    )}
    </View>
  );
};

export {EmptyCart};
