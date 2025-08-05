import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState, useContext } from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { homeStyles as styles } from "./Homestyles";
import { API_URL } from "../../api.json";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthContext from "@/context/AuthContext";
import { useTranslation } from "react-i18next";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

type ProductProps = {
  onSeeAllPress?: () => void;
  category?: string;
  sortByPrice?: "lowToHigh" | "highToLow";
  sortByRating?: "lowToHigh" | "highToLow";
};

type Product = {
  id: string;
  image: string;
  name: {
    en: string;
    ar?: string;
  };
  price: number;
  rating?: number;
  description: {
    en: string;
    ar?: string;
  };
  liked: boolean;
};

const ProductCarousel: React.FC<ProductProps> = ({
  onSeeAllPress,
  category,
  sortByPrice,
  sortByRating,
}) => {
  const { t } = useTranslation();
  const authContext = useContext(AuthContext);
  const { user, token } = authContext || {};
  const navigation = useNavigation<any>();
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [appLang, setAppLang] = useState<string>("en");

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const storedLang = await AsyncStorage.getItem("APP_LANGUAGE");
      const lang = storedLang || "en";
      setAppLang(lang);
      let products: Product[] = [];

      if (!category || category === "All") {
        // Fetch shops to get the default shop
        const shopRes = await fetch(`${API_URL}/shops?isDefault=true`);
        const shopsData = await shopRes.json();
       
        const shops = Array.isArray(shopsData)
          ? shopsData
          : (shopsData.data || []);
        const defaultShop = shops.find((shop: any) => shop.isDefault === true);
        if (!defaultShop) {
          console.warn("❌ No default shop found");
          setProductsList([]);
          setLoading(false);
          return;
        }
        const defaultShopId = defaultShop._id;
        // Fetch all products
        const response = await fetch(`${API_URL}/products?shop=${defaultShopId}`);
        const json = await response.json();
        if (json.success) {
          // Filter products for the default shop
          products = json.data
            .filter((product: any) => product.shop._id === defaultShopId)
            .map((product: any) => ({
              id: product._id,
              image:
                product.baseImage?.[0] ||
                product.variants?.[0]?.images?.[0] ||
                "https://via.placeholder.com/150",
              name: product.name || { en: "Unnamed", ar: "" },
              price: product.defaultVariant?.price || 0,
             // description: product.description || { en: "", ar: "" },
              rating: product.averageRating ,
              liked: false,
          })
        );
       
        }
      } else {
        const response = await fetch(`${API_URL}/categories/products`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ category }),
        });
        const json = await response.json();
        if (json.success) {
        
          products = json.data.map((product: any) => ({
            id: product._id,
            image:
              product.baseImage?.[0] || 
              "https://via.placeholder.com/150",
            name: product.name || { en: "Unnamed", ar: "" },
            price: product.variants[0].price ,
        //    description: product.description || { en: "", ar: "" },
            rating: product.averageRating || 4.5,
            liked: false,
          }));
        }
      }
      
      // Debug: check sortByPrice and price types
      const effectiveSortByPrice = sortByPrice;
     
      // Ensure all prices and ratings are numbers
      products = products.map(p => ({ ...p, price: Number(p.price) || 0, rating: Number(p.rating) || 0 }));
      // Sort by price if set
      if (sortByPrice === "lowToHigh") {
        products.sort((a, b) => a.price - b.price);
      } else if (sortByPrice === "highToLow") {
        products.sort((a, b) => b.price - a.price);
      } else if (sortByRating === "lowToHigh") {
        products.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
      } else if (sortByRating === "highToLow") {
        products.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      }
      setProductsList([...products]);

      // Wishlist logic
      if (user?._id && token) {
        const wishlistRes = await fetch(`${API_URL}/wishlist?userId=${user._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const wishlist = await wishlistRes.json();
        const likedIds = wishlist.map((item: any) => item._id);

        const updatedProducts = products.map((p) => ({
          ...p,
          liked: likedIds.includes(p.id),
        }));

        setProductsList(updatedProducts);
      } else {
        setProductsList(products);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, sortByPrice, sortByRating]);

  const toggleFavourite = async (id: string, userId = user?._id) => {
    if(!user?._id || !token){
      Alert.alert("Wishlist", t('profile.guestRestrictedMsg'));
      return;
    }
    const updated = productsList.map((product) =>
      product.id === id ? { ...product, liked: !product.liked } : product
    );
    setProductsList(updated);

    const updatedProduct = updated.find((product) => product.id === id);
    const isLiked = updatedProduct?.liked;

    try {
      const endpoint = isLiked ? "/wishlist/add" : "/wishlist/remove";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: id, userId }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Failed to update wishlist");
    } catch (error) {
      Alert.alert("Message", (error as Error).message || "Error updating wishlist");
    }
  };

  if (loading) {
    return (
      <View style={{ paddingVertical: 40, alignItems: "center" }}>
        <ActivityIndicator size="large" color="green" />
      </View>
    );
  }
  if (!productsList.length)
    return <View style={{ paddingVertical: 40, alignItems: "center" }}>
  <ActivityIndicator size="large" color="green" />
</View>
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("Product.RECOMMENDED FOR YOU")}</Text>
        <TouchableOpacity onPress={onSeeAllPress}>
          <Text style={styles.seeAll}>{t("Product.See all")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.productsScrollView}
      >
        {productsList.map((product) => (
          <TouchableOpacity
            key={product.id}
            style={styles.productCard}
            onPress={() =>
              navigation.navigate("ProductIndetail", {
                productID: product.id,
              })
            }
          >
            <View style={styles.productImageContainer}>
              <TouchableOpacity
                style={styles.likeButton}
                onPress={() => toggleFavourite(product.id)}
              >
                <AntDesign
                  name={product.liked ? "heart" : "hearto"}
                  style={styles.likeIcon}
                  color={product.liked ? "red" : "black"}
                />
              </TouchableOpacity>
              <Image
                source={{ uri: product.image }}
                style={styles.productimage}
              />
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>{product.rating}</Text>
                <AntDesign style={styles.star} name="star" />
              </View>
            </View>

            <View style={styles.productInfo}>
              <Text style={styles.productName}>
                {product.name?.[appLang as keyof typeof product.name] || product.name?.en}
              </Text>
              <Text style={styles.productPrice}>{product.price} QAR</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ProductCarousel;
