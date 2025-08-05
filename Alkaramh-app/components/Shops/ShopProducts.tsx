import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  TextStyle,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useRoute,
  useNavigation,
  RouteProp,
} from "@react-navigation/native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import ShopListProduct from "./ShopListProducts";
import { API_URL } from "../../api.json";
import ShopHeaderSection from "./ShopHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RouteParams = {
  selectedCategoryName?: string;
  shop?: { id: string };
};

const ShopProducts = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, RouteParams>, string>>();

  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [appLang, setAppLang] = useState("en");

  const categoryListRef = useRef<FlatList>(null);
  const shopId = route.params?.shop?.id;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (route?.params?.selectedCategoryName && categories.length > 0) {
      const index = categories.findIndex(
        (cat) => getCategoryName(cat) === route.params.selectedCategoryName?.trim()
      );
      if (index >= 0) {
        setActiveCategoryIndex(index);
        categoryListRef.current?.scrollToIndex({ index, animated: true });
      }
    }
  }, [categories, route.params]);

  const fetchCategories = async () => {
    try {
      const lang = await AsyncStorage.getItem("APP_LANGUAGE") || "en";
      setAppLang(lang);

      const res = await fetch(`${API_URL}/categories`);
      const json = await res.json();
      const allCategories = json.data || [];

      const filteredCategories = allCategories.filter(cat => cat.shop === shopId);

      const defaultAll = {
        _id: "all",
        name: { en: "All products", ar: "كل المنتجات" },
        isLocal: true,
      };

      const combined = [defaultAll, ...filteredCategories.map(cat => ({ ...cat, isLocal: false }))];

      setCategories(combined);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const getCategoryName = (cat: any) => {
    return cat?.name?.[appLang] || cat?.name?.en || "";
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const xOffset = e.nativeEvent.contentOffset.x;
    const itemWidth = wp("10%"); // approx width of each category tab
    const index = Math.round(xOffset / itemWidth);
    if (index !== activeCategoryIndex && index >= 0 && index < categories.length) {
      setActiveCategoryIndex(index);
    }
  };

  const handleTabPress = (index: number) => {
    setActiveCategoryIndex(index);
    categoryListRef.current?.scrollToIndex({ index, animated: true });
  };

  const renderCategoryTab = ({ item, index }: { item: any; index: number }) => {
    const name = getCategoryName(item);
    const isActive = activeCategoryIndex === index;

    return (
      <TouchableOpacity onPress={() => handleTabPress(index)} style={styles.tabsContainer}>
        <Text style={[styles.tabs, isActive && styles.activeTabs]}>{name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.cointainer}>
      <ScrollView horizontal={false} keyboardShouldPersistTaps="handled">
        <ShopHeaderSection shop={route.params.shop} />

        <TouchableOpacity
          style={styles.searchContainer}
          onPress={() => navigation.navigate("SearchScreen")}
        >
          <Ionicons name="search-outline" size={20} color="gray" style={{ marginRight: 6 }} />
          <TextInput
            placeholder="Search products here..."
            placeholderTextColor="#999"
            style={styles.searchInput}
            editable={false}
          />
        </TouchableOpacity>

        <View style={styles.tabsContainers}>
          <FlatList
            ref={categoryListRef}
            data={categories}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderCategoryTab}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
        </View>

        <View style={{ backgroundColor: "#fff", paddingBottom: hp("5%"),borderWidth:.1,shadowColor: "#000",shadowOffset: {
          width: 0,
          height: 1,
        },shadowOpacity: 0.55}}>
          <Text style={{ fontSize: hp('2%'), fontWeight: "bold", margin: hp("1%") }}>
            {getCategoryName(categories[activeCategoryIndex] || {})}
          </Text>
          <ShopListProduct
            categoryName={getCategoryName(categories[activeCategoryIndex] || {})}
            shopId={shopId}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  cointainer: {
    backgroundColor: "#F3F4F8",
    flex: 1,
    ...Platform.select({
      android: {
        marginTop: hp("4%"),
      },
    }),
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: wp("4%"),
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("1%"),
    borderRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#C0C0C0",
  },
  searchInput: {
    flex: 1,
    color: "#333",
    fontSize: 16,
  },
  tabsContainers: {
    flexDirection: "row",
    paddingHorizontal: wp("1%"),
   
    backgroundColor: "white",
    borderWidth:.1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
    
  },
  tabs: {
    textAlign: "center",
    fontSize: 16,
    paddingVertical: hp("1%"),
    marginHorizontal: wp("1%"),
    color: "#666",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    
  },
  activeTabs: {
    color: "#000",
    fontWeight: "bold",
  //  borderBottomColor: "#000",
  },
  tabsContainer:{
   marginHorizontal:hp('1%')
  }
});

export default ShopProducts;
