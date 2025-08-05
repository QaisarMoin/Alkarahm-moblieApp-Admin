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
  NativeSyntheticEvent,
  NativeScrollEvent,
  BackHandler,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import ListProduct from "./listproduct";
import { API_URL } from "../../api.json";
import HeaderSection from "./HearderProduct";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Products = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();

  const [categories, setCategories] = useState<any[]>([]);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [appLang, setAppLang] = useState("en");

  const categoryFlatListRef = useRef<FlatList>(null);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Home", { showCleared: false });
        return true;
      };
      const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => backHandler.remove();
    }, [])
  );

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (route.params?.selectedCategoryName) {
      const name = route.params.selectedCategoryName.trim();
      const index = categories.findIndex(
        (cat) => getCategoryName(cat) === name
      );
      if (index >= 0) {
        setActiveCategoryIndex(index);
        categoryFlatListRef.current?.scrollToIndex({ index, animated: true });
      }
    }
  }, [categories, route.params]);

  const fetchCategories = async () => {
    try {
      const [storedLang, response, shopRes] = await Promise.all([
        AsyncStorage.getItem("APP_LANGUAGE"),
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/shops?isDefault=true`),
      ]);
      const shops = await shopRes.json();
      const defaultShop = Array.isArray(shops)
        ? shops.find((shop: any) => shop.isDefault === true)
        : (shops.data || []).find((shop: any) => shop.isDefault === true);
      if (!defaultShop) {
        console.warn("No default shop found");
        setCategories([]);
        return;
      }

      const defaultShopId = defaultShop._id;
      const lang = storedLang || "en";
      setAppLang(lang);

      const json = await response.json();
      const apiCategories = json.data || [];

      const filteredCategories = apiCategories.filter((cat: any) => {
        if (!cat.shop) return false;
        if (typeof cat.shop === "string") return cat.shop === defaultShopId;
        if (typeof cat.shop === "object" && cat.shop._id) return cat.shop._id === defaultShopId;
        return false;
      });

      const defaultAll = {
        _id: "all",
        name: { en: "All products", ar: "كل المنتجات" },
        isLocal: true,
      };

      const combined = [defaultAll, ...filteredCategories.map((cat) => ({ ...cat, isLocal: false }))];
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
    const itemWidth = wp("10%");
    const index = Math.round(xOffset / itemWidth);
    if (index !== activeCategoryIndex && index >= 0 && index < categories.length) {
      setActiveCategoryIndex(index);
    }
  };

  const handleTabPress = (index: number) => {
    setActiveCategoryIndex(index);
    categoryFlatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const renderCategoryTab = ({ item, index }: { item: any; index: number }) => {
    const name = getCategoryName(item);
    const isActive = activeCategoryIndex === index;

    return (
      <TouchableOpacity
        onPress={() => handleTabPress(index)}
        style={styles.tabsContainer}
      >
        <Text style={[styles.tabs, isActive && styles.activeTabs]}>
          {name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
        <HeaderSection />

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
            data={categories}
            keyExtractor={(item) => item._id}
            horizontal
            ref={categoryFlatListRef}
            renderItem={renderCategoryTab}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={46}
          />
        </View>

       <View style={{ backgroundColor: "white" ,borderWidth:.1,shadowColor: "#000",shadowOffset: {
        width: 0,
        height: 1,
      },shadowOpacity: 0.22,shadowRadius: 2.22,elevation: 3}}>
          <Text style={{ fontSize: 15, fontWeight: "bold", margin: hp("1%") }}>
            {getCategoryName(categories[activeCategoryIndex] || {})}
          </Text>
          

          <ListProduct
            categoryName={getCategoryName(categories[activeCategoryIndex] || {})}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: "#F3F4F8", flex: 1 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: wp("4%"),
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("1%"),
    borderRadius: 10,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    color: "#333",
    fontSize: 16,
  },
  tabsContainers: {
    flexDirection: "row",
    paddingHorizontal: wp("0%"),
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
    color: "#283593",
    fontWeight: "bold",
   // borderBottomColor: "#000",
  },
  tabsContainer:{
    marginHorizontal:hp('1%')
   }
});

export default Products;
