import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Image,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import { useTranslation } from 'react-i18next';
import { API_URL } from '../../api.json';
import { Ionicons } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  raw: any;
}

const SearchScreen = ({ navigation }: { navigation: any }) => {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState<Product[]>([]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchText.trim()) {
        searchProducts(searchText);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchText]);

  const searchProducts = async (query: string) => {
    try {
      const response = await fetch(`${API_URL}/products?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.success) {
        const products: Product[] = data.data.map((item: any) => ({
          id: item._id,
          name: item.name?.en || 'Unnamed Product',
          image: item.baseImage?.[0] || 'https://via.placeholder.com/150',
          price: item.priceRange?.min || 0,
          raw: item,
        }));
        setResults(products);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => navigation.navigate('ProductIndetail', { productID: item.id })}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.textContainer}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productPrice}>QAR {item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.searchHeader}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.searchInput}
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search"
          placeholderTextColor="#999"
          autoFocus
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')} style={styles.clearIcon}>
            <Ionicons name="close" size={20} color="#555" />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.resultsContainer}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: hp('5%'),
    paddingHorizontal: wp('4%'),
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2%'),
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: wp('3%'),
    paddingHorizontal: wp('3%'),
    paddingVertical: hp('2%'),
    borderWidth: 1,
    borderColor: '#ddd',
    margin:wp('3%')
  },
  searchInput: {
    fontSize: wp('4.2%'),
    color: '#000',
  },
  cancelButton: {
    justifyContent: 'center',
    paddingHorizontal: wp('1.5%'),
  },
  cancelText: {
    fontSize: wp('4%'),
    color: '#2d46eb',
    fontWeight: '500',
  },
  resultsContainer: {
    paddingBottom: hp('2%'),
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('3%'),
    backgroundColor: '#fff',
    borderRadius: wp('2%'),
    borderWidth:1,
    borderColor:'#ddd',
    marginBottom: hp('1%'),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  productImage: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: wp('2%'),
    marginRight: wp('4%'),
    resizeMode: 'cover',
  },
  textContainer: {
    flex: 1,
  },
  productName: {
    fontSize: wp('4.2%'),
    fontWeight: '500',
    color: '#222',
  },
  productPrice: {
    fontSize: wp('3.6%'),
    color: '#888',
    marginTop: hp('0.4%'),
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clearIcon: {
    left:hp('30%')
  },
});
