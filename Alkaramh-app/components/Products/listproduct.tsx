import React, { useEffect, useState, useContext, useTransition } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { API_URL } from '../../api.json';
import AuthContext from '../../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from "react-i18next";
type RootStackParamList = {
  ProductIndetail: { productID: string };
};

type Product = {
  id: string;
  name: { en: string; ar?: string };
  image: string;
  rating: number;
  price: number;
  reviews?: string;
  description: { en?: string; ar?: string } | string;
  liked?: boolean;
};

type Props = {
  categoryName?: string;
  shopId?: string;
};
function formatCount(num: number): string {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1) + 'M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1) + 'k';
  } else {
    return num.toString();
  }
}
const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const icon =
      i <= Math.floor(rating)
        ? 'star'
        : rating >= i - 0.5
        ? 'star-half'
        : 'star-outline';
    stars.push(<Ionicons key={i} name={icon as any} size={16} color="#FFC107" />);
  }
  return stars;
};

const ListProduct: React.FC<Props> = ({ categoryName = 'all', shopId }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const authContext = useContext(AuthContext);
  const { user, token } = authContext || {};
  const {t} = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const toggleWishlist = async (id: string) => {
    if(!user?._id || !token){
     
      Alert.alert("Wishlist", t('profile.guestRestrictedMsg'));
      return;
    }
    const updated = products.map((product) =>
      product.id === id ? { ...product, liked: !product.liked } : product
    );
    setProducts(updated);

    const updatedProduct = updated.find((p) => p.id === id);
    const isLiked = updatedProduct?.liked;

    try {
      const endpoint = isLiked ? '/wishlist/add' : '/wishlist/remove';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: id, userId: user?._id }),
      });

      if (!response.ok) {
        throw new Error('Failed to update wishlist');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update wishlist. Please try again.');
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let products: Product[] = [];
      const storedLang = await AsyncStorage.getItem("APP_LANGUAGE");
      const lang = storedLang || "en";
      // setAppLang(lang); // Removed: setAppLang is not defined in this component

      // Always fetch shops to get the default shop
      const shopRes = await fetch(`${API_URL}/shops?isDefault=true`);
      const shopsData = await shopRes.json();
      const shops = Array.isArray(shopsData) ? shopsData : (shopsData.data || []);
      const defaultShop = shops.find((shop: any) => shop.isDefault === true);
      if (!defaultShop) {
        setProducts([]);
        setLoading(false);
        return;
      }
      const defaultShopId = defaultShop._id;
      console.log(`${API_URL}/products?shop=${defaultShopId}`);
      if (!categoryName || categoryName === "All products") {
        // Fetch all products for default shop
        const response = await fetch(`${API_URL}/products?shop=${defaultShopId}`);
        const json = await response.json();
        if (json.success) {
          products = json.data
            .map((product: any) => ({
              id: product._id,
              name: product.name || { en: "Unnamed" },
              image:
                product.baseImage?.[0] ||
                product.variants?.[0]?.images?.[0] ||
                "https://via.placeholder.com/150",
              price: product.defaultVariant?.price || product.price || 0,
              rating: product.averageRating || product.rating || 4.5,
              reviews: product.ratingCount,
              description: product.description || {},
              liked: false,
            }));
        }
      } else {
        // Fetch category products for default shop only
        const response = await fetch(`${API_URL}/categories/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: categoryName,
          }),
        });
        const json = await response.json();
        if (json.success) {
          products = json.data
            .map((product: any) => ({
              id: product._id,
              name: product.name || { en: "Unnamed" },
              image:
                product.baseImage?.[0] ||
                product.variants?.[0]?.images?.[0] ||
                "https://via.placeholder.com/150",
              price: product.variants[0].price || product.price || 0,
              rating: product.averageRating || product.rating || 4.5,
              reviews: product.ratingCount || 0,
              description: product.description || {},
              liked: false,
            }));
        }
      }
      
      if (user?._id && token) {
        const res = await fetch(`${API_URL}/wishlist?userId=${user._id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const wishlist = await res.json();
        const likedIds = Array.isArray(wishlist) ? wishlist.map((item: any) => item._id) : [];
        const updated = products.map((product) => ({
          ...product,
          liked: likedIds.includes(product.id),
        }));
        setProducts(updated);
      } else {
        setProducts(products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryName, shopId]);

  if (loading)
    return <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />;

  if (!products.length)
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ textAlign: 'center',justifyContent:'center',alignItems:'center',marginTop:hp('10%') }}>No products found.</Text></View>;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {products.map((item) => (
          <TouchableWithoutFeedback
            key={item.id}
            onPress={() => navigation.navigate('ProductIndetail', { productID: item.id })}
          >
            <View style={styles.card}>
              <View style={styles.imageContainer}>
                <Image source={{ uri: item.image }} style={styles.image} />
                <TouchableOpacity onPress={() => toggleWishlist(item.id)} style={styles.heartIcon}>
                  <Ionicons
                    name={item.liked ? 'heart' : 'heart-outline'}
                    size={20}
                    color={item.liked ? 'red' : 'black'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <Text style={styles.name}>{item.name.en}</Text>
                <View style={styles.ratingRow}>
                  {renderStars(item.rating)}
                  <Text style={styles.reviews}>
                  ({item.reviews ? `${formatCount(item.reviews)}` : "0 Reviews"})
                  </Text>
                </View>
                <Text style={styles.price}>{item.price} QAR</Text>
                <Text style={styles.description}>
                  {typeof item.description === 'string'
                    ? item.description
                    : item.description?.en || item.description?.ar || 'Not Available'}
                </Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ListProduct;

const styles = StyleSheet.create({
  container: {},
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderBottomColor: '#D9D9D9',
    borderBottomWidth: hp('0.1%'),
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#DADADA',
    borderRadius: 12,
    alignItems: 'center',
  },
  image: {
    width: wp('30%'),
    height: hp('15%'),
    borderRadius: 12,
  },
  heartIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 100,
    padding: 5,
    elevation: 2,
    borderWidth:1,
    borderColor:'#E7E7E9'
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reviews: {
    marginLeft: 4,
    fontSize: 12,
    color: '#555',
  },
  price: {
    color: '#283593',
    fontWeight: '700',
    fontSize: 14,
    marginVertical: 4,
  },
  description: {
    fontSize: 12,
    color: '#666',
  },
});
