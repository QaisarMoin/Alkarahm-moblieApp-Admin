import React, { useContext, useEffect, useState } from 'react';
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
import { t } from 'i18next';

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

const ShopListProduct: React.FC<Props> = ({ categoryName = 'All products', shopId }) => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const authContext = useContext(AuthContext);
  const { user, token } = authContext || {};
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProducts = async () => {   
    try {
      setLoading(true);
      let products: Product[] = [];
      const storedLang = await AsyncStorage.getItem("APP_LANGUAGE");
      const lang = storedLang || "en";
     
     {/* const shopRes = await fetch(`${API_URL}/shops`);
      const shopsData = await shopRes.json();
      const shops = Array.isArray(shopsData) ? shopsData : (shopsData.data || []);
      const defaultShop = shops.find((shop: any) => shop.isDefault === true);
      console.log(defaultShop);
      if (!defaultShop) {
        setProducts([]);
        setLoading(false);
        return;

      } */}
      const defaultShopId = shopId;
      
      if (categoryName === "All products") {
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
              reviews: product.ratingCount?.toString() || '10',
              description: product.description || {},
              liked: false,
            }));
        }
      } else {
        
        console.log(`${API_URL}/categories/products`);
        console.log(categoryName);
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
              price:product.variants[0].price || product.price || 0,
              rating: product.averageRating || product.rating || 4.5,
              reviews: product.ratingCount?.toString() || '10',
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

  const toggleFavorite = async (id: string) => {
    if(!user?._id || !token){
     
      Alert.alert("Wishlist", t('profile.guestRestrictedMsg'));
      return;
    }
    const updated = products.map((product) =>
      product.id === id ? { ...product, liked: !product.liked } : product
    );
    setProducts(updated);

    const isLiked = updated.find((p) => p.id === id)?.liked;
    const userId = user?._id;

    if (!userId) {
      Alert.alert('Login required', 'Please login to use wishlist.');
      return;
    }

    try {
      const endpoint = isLiked ? '/wishlist/add' : '/wishlist/remove';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: id, userId }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to update wishlist');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while updating wishlist.');
    }
  };

  if (loading)
    return <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />;

  if (!products.length)
    return <Text style={{ textAlign: 'center', marginTop: 40 }}>No products found.</Text>;

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
                <TouchableOpacity
                  onPress={() => toggleFavorite(item.id)}
                  style={styles.heartIcon}
                >
                  <Ionicons
                    name={item.liked ? 'heart' : 'heart-outline'}
                    size={20}
                    color={item.liked ? 'red' : 'gray'}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.content}>
                <Text style={styles.name}>{item.name.en}</Text>
                <View style={styles.ratingRow}>
                  {renderStars(item.rating)}
                  <Text style={styles.reviews}> ({item.reviews})</Text>
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

export default ShopListProduct;

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
    top: 4,
    right: 4,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    elevation: 2,
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
