import React, { useEffect, useState, useCallback } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { homeStyles as styles } from "./Homestyles";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../../api.json";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

type CategoryProps = {
  onSeeAllPress?: () => void;
  setcategory?: (category: string) => void; // ✅ correct type

};

type Category = {
  _id: string;
  name: {
    en: string;
    ar?: string;
  };
  image: string;
  active?: boolean;
  isLocal?: boolean;
};

const CategoryList: React.FC<CategoryProps> = ({ onSeeAllPress,setcategory }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [appLang, setAppLang] = useState<string>("en");
  const [loading, setLoading] = useState<boolean>(true);
  const fetchCategories = async () => {
    try {
      setLoading(true);

      const [storedLang, response, shopRes] = await Promise.all([
        AsyncStorage.getItem("APP_LANGUAGE"),
        fetch(`${API_URL}/categories`),
        fetch(`${API_URL}/shops?isDefault=true`),
      ]);
      const shops = await shopRes.json();
      // shops is an array
      const defaultShop = Array.isArray(shops)
        
        ? shops.find((shop: any) => shop.isDefault === true)
        : (shops.data || []).find((shop: any) => shop.isDefault === true);
      if (!defaultShop) {
        console.warn(" No default shop found");
        setCategories([]);
        setLoading(false);
        return;
      }
      const defaultShopId = defaultShop._id;

      const lang = storedLang || "en";
      setAppLang(lang);

      const json = await response.json();
      const apiCategories = json.data || [];
      // Filter categories for default shop
      const filteredCategories = apiCategories.filter(
        (cat: any) => cat.shop === defaultShopId
      );

      const defaultAll: Category = {
        _id: "all",
        name: { en: "All", ar: "الكل" },
        image: require("../../assets/all.png"),
        active: true,
        isLocal: true,
      };

      const updated = filteredCategories.map((cat: Category) => ({
        ...cat,
        active: false,
        isLocal: false,
      }));

      setCategories([defaultAll, ...updated]);
     
    } catch (error) {
      console.log("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryPress = useCallback((selectedId: string,selectedName:string) => {
    
    setCategories((prev) =>
      prev.map((cat) => ({
        ...cat,
        active: cat._id === selectedId,
      }))
    );
    if (setcategory) {
      setcategory(selectedName);
    }
    
  }, [setcategory]);

  const renderCategoryItem = useCallback(
    ({ item }: { item: Category }) => (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          item.active && styles.categoryItemActive,
        ]}
        onPress={() => handleCategoryPress(item._id,item.name.en)}
      >
        <View style={styles.categoryIcon}>
          <Image
            style={styles.categoryIconText}
            source={item.isLocal ? item.image : { uri: item.image }}
          />
        </View>
        <Text
          style={[
            styles.categoryName,
            item.active && styles.categoryNameActive,
          ]}
        >
          {item.name?.[appLang] || item.name?.en}
        </Text>
      </TouchableOpacity>
    ),
    [appLang, handleCategoryPress,setcategory]
  );

  const getItemLayout = (_: any, index: number) => ({
    length: 80,
    offset: 80 * index,
    index,
  });

  return (
    <View style={styles.categoriesContainer}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("Category.title")}</Text>
          <TouchableOpacity onPress={onSeeAllPress}>
            <Text style={styles.seeAll}>{t("Category.See all")}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
 <View style={{ paddingVertical: 40, alignItems: "center",justifyContent:'center' }}>
 <ActivityIndicator size="large" color="green" />
</View>        ) : (
          <FlatList
            data={categories}
            keyExtractor={(item) => item._id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderCategoryItem}
            contentContainerStyle={{ paddingVertical: 10 }}
            initialNumToRender={8}
            getItemLayout={getItemLayout}
            removeClippedSubviews={true}
            windowSize={5}
          />
        )}
      </View>
    </View>
  );
};

export default CategoryList;
