import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../../api.json";
import { useTranslation } from "react-i18next";
import AuthContext from '../../context/AuthContext';
import i18n from "@/i18n";
import { loadStoredAddresses } from "@/Utils/addressStorage";


const IMAGE_MAX_HEIGHT = hp("30%");
const IMAGE_MIN_HEIGHT = hp("12%");

function formatCount(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1) + 'M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1) + 'k';
  } else {
    return num.toString();
  }
}

const ProductDetails = ({ navigation, route }: any) => {
  const { t } = useTranslation();
  const isArabic = i18n.language === "ar";
  const nav = useNavigation();
  const productId = route?.params?.productID;
  const authContext = useContext(AuthContext);
  const { user, token, isGuest } = authContext || {};
  const [addToCartLoading, setAddToCartLoading] = useState(false);



  const quantityOptions = ["10", "20", "30", "40"];

  // Animated value for scroll position
  const scrollY = useRef(new Animated.Value(0)).current; // persistent ref

  // Interpolate image height based on scroll
  const imageHeight = scrollY.interpolate({
    inputRange: [0, IMAGE_MAX_HEIGHT - IMAGE_MIN_HEIGHT],
    outputRange: [IMAGE_MAX_HEIGHT, IMAGE_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const [product, setProduct] = useState<any>({});
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [displayPrice, setDisplayPrice] = useState<number>(0);
  const [selectedQuantity, setSelectedQuantity] = useState(quantityOptions[0]);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customQty, setCustomQty] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  // New state to manage if the product is in the cart
  const [isInCart, setIsInCart] = useState(false); 


  const fetchProductAndWishlist = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/products/${productId}`);
    
      const data = await res.json();
      setProduct(data);

      const variantList = data.data?.variants || [];
      const defaultVar = variantList.find((v: any) => v.isDefault) || variantList[0];

      setVariants(variantList);
      setSelectedVariant(defaultVar);
      setBasePrice(defaultVar?.price || 0);
      setDisplayPrice(defaultVar?.price || 0);

      // Fetch wishlist
      if (user?._id && token) {
        const wishlistRes = await fetch(`${API_URL}/wishlist?userId=${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const wishlistData = await wishlistRes.json();
        const liked = wishlistData.some((item: any) => item._id === productId);
        setIsFavorite(liked);
      }
      // In a real app, you would also check if this product is already in the user's cart here
      // For this example, we'll assume it's not in the cart initially.
      setIsInCart(false); 

    } catch (error) {
      console.error("Failed to fetch product or wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) fetchProductAndWishlist();
  }, [productId]);

  const handleVariantSelect = (variant: any) => {
    const index = variants.findIndex((v) => v._id === variant._id);
  
    setSelectedVariant(variant);
    setBasePrice(variant.price);
    setDisplayPrice(variant.price);
  
    // Set quantity based on variant index
    if (index >= 0 && index < quantityOptions.length) {
      setSelectedQuantity(quantityOptions[index]);
    } else {
      setSelectedQuantity(quantityOptions[0]); // fallback
    }
    // When variant changes, reset isInCart as it's a new "product" in a sense
    setIsInCart(false); 
    setCustomQty("");
  };
  

const handleCartAction = async (actionType: 'add' | 'buy') => {
  if (isGuest) {
    guestRestrictionAlert();
    return;
  }

  const quantityToUse = customQty || selectedQuantity;

  const data = {
    productId: productId,
    name: product.data?.name?.en || product.data?.name?.ar || "Unnamed",
    price: displayPrice,
    variant: selectedVariant?.name?.en || selectedVariant?.name?.ar || "Unnamed",
    variantid: selectedVariant?._id,
    quantity: quantityToUse,
    image: selectedVariant?.images?.[0] || product.data?.baseImage?.[0],
  };

  if (actionType === 'add' && !isInCart) {
    try {
      setAddToCartLoading(true);
      const res = await fetch(`${API_URL}/cart/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?._id,
          productId: data.productId,
          variantId: data.variantid,
          quantity: data.quantity,
        }),
      });
      setIsInCart(true);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setAddToCartLoading(false);
    }

  } 
  else if (actionType === 'buy') {

    try {
      const selectedProductForCheckout = {
        _id: product._id,
        product: product,
        variant: selectedVariant._id,
        quantity: quantityToUse,
        price: displayPrice,
      };
      const storedAddresses = await loadStoredAddresses();
      const selectedAddressObj = storedAddresses[0];

      if (storedAddresses.length === 0) {
        Alert.alert(
          "No addresses found",
          "Please add an address to proceed with the purchase."
        );
        return;
      }
      navigation.navigate("Checkout", {
        selectedItems: [selectedProductForCheckout],
        address: selectedAddressObj,
        userId: user?._id,
      });
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  }
  
  else {
    (navigation || nav).navigate("Cart", { showEmpty: false });
  }
};



  const toggleWishlist = async () => {
    if (!user?._id || !token) {
      Alert.alert("Login required", "Please login to use wishlist.");
      return;
    }

    try {
      const endpoint = isFavorite ? "/wishlist/remove" : "/wishlist/add";
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user._id, productId }),
      });

      const result = await response.json();
    

      if (!response.ok) throw new Error(result.message || "Wishlist update failed");
      setIsFavorite(!isFavorite);
    } catch (error: any) {
      console.error("Wishlist error:", error);
      Alert.alert("Error", error.message || "Failed to update wishlist.");
    }
  };

  const guestRestrictionAlert = () => {
    Alert.alert(
      t('profile.guestRestrictedTitle') || 'Guest Restricted',
      t('profile.guestRestrictedMsg') || 'Please login or create an account to access this feature.'
    );
  };

  const handleFavoritePress = () => {
    if (isGuest) return guestRestrictionAlert();
    toggleWishlist();
  };

  const renderStars = (rati: number) => {
    const fullStars = Math.floor(rati);
    const hasHalfStar = rati % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    const stars = [];
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={`full-${i}`} name="star" size={18} color="#FFD700" />);
    }
    if (hasHalfStar) {
      stars.push(<Ionicons key={`half`} name="star-half" size={18} color="#FFD700" />);
    }
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Ionicons key={`empty-${i}`} name="star-outline" size={18} color="#FFD700" />);
    }
    return stars;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="green" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: hp("13%") }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Animated Image at the top */}
        <View style={styles.imageContainer}>
          <Animated.Image
            source={{ uri: selectedVariant?.images?.[0] || product.data?.baseImage?.[0] || "https://via.placeholder.com/150" }}
            style={[styles.productImage, { height: imageHeight }]}
            resizeMode="contain"
          />
    
        </View>

        {/* Product Content */}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.productTitle}>{selectedVariant?.name?.en || product.data?.name?.en || "Unnamed"}</Text>
            <TouchableOpacity onPress={handleFavoritePress}>
              <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "red" : "#888"} />
            </TouchableOpacity>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.starRow}>{renderStars(product.data?.averageRating || 4.5)}</View>
            <Text style={styles.ratingValue}>{product.data?.averageRating || 4.5}</Text>
            <Text style={styles.ratingCount}>
              ({product.data?.reviewCount ? `${formatCount(product.data.reviewCount)} Reviews` : "0 Reviews"})
            </Text>
          </View>

          <Text style={styles.price}>{displayPrice.toFixed(0)} QAR</Text>


          <Text style={styles.sectionTitle}>{t('ProductInfo.Variants')}</Text>
          <ScrollView style={styles.variantRow} horizontal={true} showsHorizontalScrollIndicator={false}>
            {variants.map((variant) => (
              <TouchableOpacity
                key={variant._id}
                onPress={() => handleVariantSelect(variant)}
                style={[
                  styles.variantButton,
                  selectedVariant?._id === variant._id && styles.variantSelected,
                ]}
              >
                <Text
                  style={[
                    styles.variantText,
                    selectedVariant?._id === variant._id && styles.variantTextSelected,
                  ]}
                >
                  {variant.name?.en || "Unnamed"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sectionTitle}>{t('ProductInfo.Description')}</Text>
          <Text style={styles.description}>
            {isArabic ? product.data?.description?.ar : product.data?.description?.en}
          </Text>

          <Text style={styles.sectionTitle}>{t('ProductInfo.Choose Quantity')}</Text>
          <View style={styles.quantityRow}>
            {quantityOptions.map((qty) => (
              <TouchableOpacity
                key={qty}
                style={[
                  styles.quantityButton,
                  selectedQuantity === qty && styles.variantSelected,
                ]}
                onPress={() => {
                  setCustomQty("");
                  setSelectedQuantity(qty);
                  setIsInCart(false); // Reset isInCart when quantity changes
                }}
              >
                <Text
                  style={[
                    styles.quantityText,
                    selectedQuantity === qty && styles.variantTextSelected,
                  ]}
                >
                  {qty}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.customButton} onPress={() => setCustomModalVisible(true) }>
              <Text style={styles.customText}>{t('ProductInfo.Custom')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>

      {customModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('ProductInfo.Custom quantity')}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t('ProductInfo.Enter quantity')}
              keyboardType="numeric"
              value={customQty}
              onChangeText={(text) => {
                setCustomQty(text);
                setIsInCart(false); // Reset isInCart when custom quantity is being entered
              }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonPrimary}
                onPress={() => {
                  if (isGuest) return guestRestrictionAlert();
                  setCustomModalVisible(false);
                  handleCartAction('add'); // Custom quantity always acts like "Buy Now"
                }}
              >
                <Text style={styles.modalButtonTextPrimary}>{isInCart ? t('ProductInfo.Go to Cart') : t('ProductInfo.Add to cart')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

<View style={styles.footer}>
  <TouchableOpacity
    style={styles.cartButton}
    onPress={() => handleCartAction('add')}
    disabled={addToCartLoading} // optional: disable button while loading
  >
    {addToCartLoading ? (
      <ActivityIndicator size="small" color="#283593" />
    ) : (
      <Text style={styles.cartButtonText}>
        {isInCart ? t('ProductInfo.Go to Cart') : t('ProductInfo.Add to cart')}
      </Text>
    )}
  </TouchableOpacity>

  <TouchableOpacity style={styles.buyButton} onPress={() => handleCartAction('buy')}>
    <Text style={styles.buyButtonText}>{t('ProductInfo.Buy Now')}</Text>
  </TouchableOpacity>
</View>

      
    </SafeAreaView>
  );
};

export default ProductDetails;


const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { paddingTop: hp("1%") },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: wp("4%"),
  },
  headerTitle: {
    fontSize: hp("2.3%"),
    fontWeight: "600",
    marginLeft: wp("2%"),
  },
  imageContainer: {
    position: "relative",
    alignItems: "center",
    paddingHorizontal: wp("4%"),
    backgroundColor: "#fff",
  },
  productImage: {
    width: wp("70%"),
    height: IMAGE_MAX_HEIGHT, // default, will be animated
    borderRadius: 12,
    marginTop: hp("2%"),
    marginBottom: hp("1%")
  },
  shareIcon: {
    position: "absolute",
    top: 10,
    right: 20,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 8,
    elevation: 2,
    shadowColor: "#000",
  },
  content: {
    paddingHorizontal: wp("5%"),
    width: "100%",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: hp("2%"),
  },
  productTitle: {
    fontSize: hp("2.3%"),
    fontWeight: "600",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  starRow: {
    flexDirection: "row",
    marginRight: 6,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: "bold",
    marginHorizontal: 4,
  },
  ratingCount: {
    fontSize: 14,
    color: "#777",
  },
  price: {
    marginTop: hp("1%"),
    color: "#283593",
    fontSize: hp("2.5%"),
    fontWeight: "bold",
  },
  sectionTitle: {
    marginTop: hp("2.5%"),
    fontSize: hp("2%"),
    fontWeight: "500",
  },
  variantRow: {
    flexDirection: "row",
    marginTop: hp("1%"),

    gap: 20,
  },
  variantButton: {
    paddingVertical: hp("1%"),
    paddingHorizontal: wp("4%"),
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    margin:2,
  },
  variantSelected: {
    backgroundColor: "#283593",
    borderColor: "#283593",
  },
  variantText: {
    fontSize: hp("1.9%"),
    color: "#333",
  },
  variantTextSelected: {
    color: "#fff",
  },
  description: {
    marginTop: hp("1%"),
    color: "#444",
    lineHeight: 22,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: wp("4%"),
    borderTopWidth: 1,
    borderColor: "#eee",
    zIndex: 100,
  },
  cartButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#283593",
    paddingVertical: hp("1.5%"),
    borderRadius: 10,
    marginRight: wp("2%"),
    alignItems: "center",
  },
  cartButtonText: {
    color: "#2731d2",
    fontWeight: "600",
    fontSize: hp("2%"),
  },
  buyButton: {
    flex: 1,
    backgroundColor: "#283593",
    paddingVertical: hp("1.5%"),
    borderRadius: 10,
    alignItems: "center",
  },
  buyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: hp("2%"),
  },quantityRow: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 10,
  marginTop: hp("1%"),
},

quantityButton: {
  paddingVertical: hp("1%"),
  paddingHorizontal: wp("5%"),
  borderRadius: 10,
  backgroundColor: "#F2F2F7",
},

quantityText: {
  fontSize: hp("1.9%"),
  color: "#8E8E93",
  fontWeight: "500",
},

customButton: {
  paddingVertical: hp("1%"),
  paddingHorizontal: wp("5%"),
  borderRadius: 10,
  backgroundColor: "#F2F2F7",
},

customText: {
  fontSize: hp("1.9%"),
  color: "#8E8E93",
  fontWeight: "500",
},
modalOverlay: {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 10,
},

modalContent: {
  width: "80%",
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  padding: 20,
  alignItems: "center", // Center all child elements
},

modalTitle: {
  fontSize: 18,
  fontWeight: "500",
  marginBottom: 12,
  alignSelf: "flex-start",
},

modalInput: {
  width: "100%",
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 10,
  paddingHorizontal: 10,
  paddingVertical: 8,
  fontSize: 16,
  marginBottom: 16,
},

modalButtons: {
  width: "100%",
  flexDirection: "row",
  justifyContent: "center", // Center button horizontally
},

modalButtonPrimary: {
  width: "60%", // Adjust width as needed
  padding: 12,
  backgroundColor: "#283593",
  borderRadius: 8,
  alignItems: "center",
},

modalButtonTextPrimary: {
  color: "#fff",
  fontWeight: "600",
  fontSize: 16,
},

 loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },


});
