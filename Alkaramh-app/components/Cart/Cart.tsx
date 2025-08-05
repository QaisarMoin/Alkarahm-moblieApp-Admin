import { Cartstyles as styles } from "./CartStyleSheet";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { loadStoredAddresses, Address } from "../../Utils/addressStorage";

import React, { useEffect, useState, useContext } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { EmptyCart } from "./EmptyCart";
import AuthContext from "@/context/AuthContext";
import { API_URL } from "../../api.json";
import { useTranslation } from "react-i18next";
import { CartUnionSVGComponent, TrachSVGComponent } from "../Homepage/svgs/svgComponents";

interface Product {
  _id: string;
  name: { en: string; ar?: string };
  description: { en: string; ar?: string };
  price: number;
  baseImage: string[];
  stock: number;
  variants: any[];
}

interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  variant: string;
  price: number;
  variantName?: string;
}

const Cart = () => {
  const { t } = useTranslation();
  const { user, token } = useContext(AuthContext) || {};
  const navigation = useNavigation<any>();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [tempQuantities, setTempQuantities] = useState<{ [productId: string]: string }>({});
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [storedAddresses, setStoredAddresses] = useState<Address[]>([]);
  const [showLocations, setShowLocations] = useState<boolean>(false);
  const [deletemodal, setdeletemodal] = useState(false);
  const [productToDeleteId, setProductToDeleteId] = useState<string | null>(null);
  const [variantToDeleteId, setVariantToDeleteId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);
  const isArabic = 


  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchCartItems();
      await fetchAndSetAddresses();
      const flag = await AsyncStorage.getItem('guestMode');
      setIsGuest(flag === 'true');
      setLoading(false);
    };
    initialize();
  }, []);
  
  useFocusEffect(
    React.useCallback(() => {
      const refresh = async () => {
        setLoading(true);
        await fetchCartItems();
        await fetchAndSetAddresses();
        setLoading(false);
      };
      refresh();
    }, [])
  );
  

  const fetchAndSetAddresses = async () => {
    const parsed = await loadStoredAddresses();
    setStoredAddresses(parsed);
    if (parsed.length > 0) {
      const addr = parsed[0];
      setSelectedLocation(`${addr.street}, ${addr.city}, ${addr.country}`);
    }
  };

  const fetchCartItems = async () => {
    if (!user?._id) return;
    try {
      const response = await fetch(`${API_URL}/cart/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        const cartData = result.data.map((item: any) => ({
          _id: item._id,
          product: item.product,
          quantity: item.quantity,
          variant: item.variant,
          variantName: item.product.variants.find((v: any) => v._id === item.variant)?.name,
          price: item.price,
        }));
        setCartItems(cartData);
        const init: { [productId: string]: string } = {};
        cartData.forEach((item) => {
          init[item.variant] = item.quantity.toString();
        });
        setTempQuantities(init);
      }
    } catch (error) {
      console.error("Cart fetch failed:", error);
    }
  };

  const openDeleteModal = (productId: string, variantId: string) => {
    setProductToDeleteId(productId);
    setVariantToDeleteId(variantId);
    setdeletemodal(true);
  };

  const handleRemoveFromCart = async () => {
    if (!user?._id || !productToDeleteId || !variantToDeleteId) return;
    try {
      await fetch(`${API_URL}/cart/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, productId: productToDeleteId, variantId: variantToDeleteId }),
      });
      setCartItems((prev) =>
        prev.filter((item) => item.product._id !== productToDeleteId || item.variant !== variantToDeleteId)
      );
    } catch (error) {
      Alert.alert("Error", "Failed to remove.");
    } finally {
      setdeletemodal(false);
    }
  };

  const handleUpdateQuantity = async (variantId: string, change: number) => {
    const item = cartItems.find((i) => i.variant === variantId);
    if (!item) return;
    const newQty = parseInt(item.quantity.toString()) + change;
    if (newQty < 1) return;
    setCartItems((prev) =>
      prev.map((i) => (i.variant === variantId ? { ...i, quantity: newQty } : i))
    );
   setTempQuantities((prev) => ({ ...prev, [variantId]: newQty.toString() }));
    for (const item of cartItems) {
      console.log(JSON.stringify({
        userId: user?._id,
        productId: item.product._id,
        quantity: parseInt(newQty.toString()),
        variantId: item.variant,
      }));
      const res = await fetch(`${API_URL}/cart/update-quantity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?._id,
          productId: item.product._id,
          quantity: parseInt(newQty.toString()),
          variantId: item.variant,
        }),
      });

    
    }
  };

  const handleCheckout = async () => {
    if (!user?._id) return;

    for (const item of cartItems) {
      await fetch(`${API_URL}/cart/update-quantity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          productId: item.product._id,
          quantity: parseInt(item.quantity.toString()),
          variantId: item.variant,
        }),
      });
    }

    const selectedItems = cartItems.map((item) => ({
      _id: item.product._id,
      variant: item.variant,
      quantity: parseInt(item.quantity.toString()),
      price: item.price,
      product: item.product,
    }));

    const selectedAddressObj =
      storedAddresses.find(
        (addr) =>
          `${addr.street}, ${addr.city}, ${addr.country}` === selectedLocation
      ) || storedAddresses[0];
 
    navigation.navigate("Checkout", {
      selectedItems,
      address: selectedAddressObj,
      userId: user._id,
    });
  };
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="green" />
          <Text style={{ marginTop: 10 }}>Loading your cart...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F6FB" />
     
        <View style={styles.locationContainer}>
          <TouchableOpacity
            style={styles.addressRow}
            onPress={() => setShowLocations(!showLocations)}
          >
            <Ionicons name="location-sharp" size={18} color="#283593" />
            <Text style={styles.addressText}>{selectedLocation || "Select your address"}</Text>
            <Ionicons
              name={showLocations ? "chevron-up" : "chevron-down"}
              size={18}
              color="#3B82F6"
            />
          </TouchableOpacity>

          {showLocations && (
            <View style={styles.locationDropdown}>
              {storedAddresses.length > 0 ? (
                storedAddresses.map((addr) => (
                  <TouchableOpacity
                    key={addr._id}
                    style={styles.locationItem}
                    onPress={() => {
                      setSelectedLocation(`${addr.street}, ${addr.city}, ${addr.country}`);
                      setShowLocations(false);
                    }}
                  >
                    <Text style={styles.locationText}>
                      {addr.street}, {addr.city}, {addr.country}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.addressText}>No saved addresses</Text>
              )}

              <TouchableOpacity
                style={styles.manageAddressBtn}
                onPress={() => {
                  setShowLocations(false);
                  navigation.navigate("AddressBook");
                }}
              >
                <Ionicons name="map-outline" size={18} color="#3B82F6" />
                <Text style={styles.manageAddressText}>Manage Saved Addresses</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.cartItemBox}>
          {cartItems.length === 0 ? (
            <EmptyCart />
          ) : (
            cartItems.map((item) => (
              <View key={item._id + item.variant} style={styles.cartCard}>
                <View style={styles.cardImageBox}>
                  <Image source={{ uri: item.product.baseImage[0] }} style={styles.cartImage} />
                </View>
                <View style={styles.productDetailsContainer}>
                  <View style={styles.productInfoBlock}>
                    <Text style={styles.cartName}>{item.product.name.en}</Text>
                    <Text style={styles.productDesc}>
                      {item.variantName?.en || item.variantName?.ar || "NAN"}
                    </Text>
                    <Text style={styles.priceText}>{item.price.toFixed(0) * tempQuantities[item.variant]} QAR</Text>
                  </View>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity onPress={() => handleUpdateQuantity(item.variant, -1)} style={styles.quantityBtn}>

                      <MaterialIcons name="remove-circle-outline" size={24} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.quantityInput}>
                      {tempQuantities[item.variant]}
                    </Text>
                    <TouchableOpacity onPress={() => handleUpdateQuantity(item.variant, 1)} style={styles.quantityBtn}>
                      <MaterialIcons name="add-circle-outline" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => openDeleteModal(item.product._id, item.variant)}
                >
                  <TrachSVGComponent/>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {cartItems.length > 0 && (
          <View style={styles.checkoutBtnUltraWrapper}>
            <TouchableOpacity style={styles.checkoutBtnUltra} onPress={() => {
              if (isGuest) {
                Alert.alert(
                  t('profile.guestRestrictedTitle') || 'Guest Restricted',
                  t('profile.guestRestrictedMsg') || 'Please login or create an account to access this feature.'
                );
              } else {
                handleCheckout();
              }
            }}>
              <Text style={styles.checkoutText}>{t("Cart.Checkout")}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={deletemodal}
        onRequestClose={() => {
          setdeletemodal(false);
          setProductToDeleteId(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <CartUnionSVGComponent style={{ position: 'absolute', zIndex: 0 }} />
          <View style={styles.modalContainer}>
            <View style={styles.trashIconContainer}>
              <TrachSVGComponent size={50}/>
            </View>
            <Text style={styles.modalTitle}>Are you sure to delete?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setdeletemodal(false);
                  setProductToDeleteId(null);
                }}
              >
                <Text style={styles.cancelText}>No, keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={handleRemoveFromCart}
              >
                <Text style={styles.confirmText}>Yes, delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Cart;
