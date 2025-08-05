import { AntDesign, Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  StatusBar,
} from 'react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { useRoute, useNavigation } from '@react-navigation/native';

import Products from '../Products/Products';
import Footer from '../../Utils/Footer/Footer';
import CategoryList from './CategoryList';
import Header from './Header';
import ProductCarousel from './ProductCarousel';
import { homeStyles as styles } from './Homestyles';
import FilterBar from './Filterbar';
import FilterPopup from './filterPopup';
import SpotlightCardList from './SpotlightCardList';


const Home: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const showClearedScreen = route && 'params' in route && (route as any).params?.showCleared || false;
  const [previouslyOrdered, setPreviouslyOrdered] = useState<boolean | null>(null);
  const [rating4, setrating4] = useState<boolean | null>(null);
  const [greatoffers, setgreatoffers] = useState<boolean | null>(null);
  const [category, setcategory] = useState("All");
  const [selectedSort, setSelectedSort] = useState<string | null>(null);
  const [sortByPrice, setSortByPrice] = useState<"lowToHigh" | "highToLow" | undefined>(undefined);
  const [sortByRating, setSortByRating] = useState<"lowToHigh" | "highToLow" | undefined>(undefined);

  const handleApplyFilters = (filters: any) => {
    if (filters?.sortByPrice !== undefined) {
      setSortByPrice(filters.sortByPrice);
    }
    if (filters?.sortByRating !== undefined) {
      setSortByRating(filters.sortByRating);
    }
    if (filters?.selectedSort !== undefined) {
      setSelectedSort(filters.selectedSort);
    }
  };


//  console.log(category);
  const handleClear = () => {
    navigation.navigate('Home', { showCleared: true });
  };

  return (
    <SafeAreaView style={styles.container}>

     <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" /> 

      {showClearedScreen ? (
        <Products />
        
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: hp('10%') }}
        >
          <Header />
        {/*  <CategoryList onSeeAllPress={handleClear} setcategory={setcategory}/> */}
          <FilterBar
            setPreviouslyOrdered={setPreviouslyOrdered}
            setrating4={setrating4}
            setgreatoffers={setgreatoffers}
            onApplyFilters={handleApplyFilters}
            selectedSort={selectedSort}
            setSelectedSort={setSelectedSort}
          />
          <ProductCarousel onSeeAllPress={handleClear} category={category} sortByPrice={sortByPrice} sortByRating={sortByRating} />

          {/* Spotlight Section */}
          <SpotlightCardList
            
            OnSellAll={(shop: any) => 
              navigation.navigate('ShopProductsScreen', { shop })
            }
            previouslyOrdered={previouslyOrdered}
            rating4={rating4}
            greatoffers={greatoffers}
          /> 
         
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export { Home };
