import React, { useContext } from "react";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  View,
  TextInput,
  TouchableOpacity,Text,
  Alert
} from "react-native";
import { homeStyles as styles } from "./Homestyles"; // Make sure Homestyles.ts exports `homeStyles`
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import AuthContext from "@/context/AuthContext";

const Header = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const authContext = useContext(AuthContext);
  const { isGuest } = authContext || {};
  const handleInputFocus = () => {
    navigation.navigate("SearchScreen");
  };

  const handleNotification = () => {
    if(!isGuest){
      navigation.navigate("NotificationScreen");
      return;
    }
    Alert.alert("Notification", t('profile.guestRestrictedMsg'));
      
    
    
  };

  return (
    <View style={styles.content}>
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchBar} onPress={handleInputFocus}>
          <AntDesign style={styles.searchIcon} name="search1" size={18} color="#999" />
          <Text style={styles.searchInput}>
        {t('Search.title')}
            
         </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.notificationButton} onPress={handleNotification}>
          <View style={styles.notificationIcon}>
            <Ionicons style={styles.notificationText} name="notifications-outline" size={22} color="#000" />
            <View style={styles.notificationDot} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;
