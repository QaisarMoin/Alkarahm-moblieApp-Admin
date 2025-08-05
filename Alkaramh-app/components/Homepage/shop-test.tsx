import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import {
  ClockSVGComponent,
  StarSVGComponent,
  TickSVGComponent,
  CircleSVGComponent,
} from "./svgs/svgComponents";
import LinearGradient from 'react-native-linear-gradient';

type ShopProps = {
  shop: {
    imageUrl?: string;
    businessName: string;
    deliveryTime?: string;
    rating?: number;
    hasNoComplaints?: boolean;
    isBestseller?: boolean;
    isFrequentlyReordered?: boolean;
  };
  onPress?: (shop: any) => void;
};

const ShopOutline: React.FC<ShopProps> = ({ shop, onPress }) => {
  const { width } = useWindowDimensions();
  if (!shop) return null;

  const {
    imageUrl,
    businessName,
    deliveryTime = "120 - 150 mins",
    rating = 4.8,
    hasNoComplaints = true,
    isBestseller = true,
    isFrequentlyReordered = true,
  } = shop;

  const cardWidth = Math.min(width * 0.9, 400);

  return (
    <TouchableWithoutFeedback onPress={() => onPress?.(shop)}>
      <View style={styles.container}>
        <View style={[styles.card, { width: cardWidth }]}>
          {/* Shop Image */}
          <Image
            style={[styles.image, { width: cardWidth, height: cardWidth * 0.56 }]}
            resizeMode="cover"
            source={{
              uri:
                imageUrl ||
                "https://www.alkaramh.com/static/media/hero0.907b3d64d3e59ad1bc22.jpg",
            }}
          />

          {/* Delivery Badge */}
          <LinearGradient style={styles.deliveryBadge} colors={["#000", "#fff"]} start={{ x: -0.50, y: 0 }} end={{ x: 1, y: 0 }}>
            {/*<CircleSVGComponent/> */}
            <ClockSVGComponent width={wp("3.5%")} height={wp("3.5%")} style={{marginLeft:wp('2%')}}/>
            <Text style={styles.deliveryText}>{deliveryTime}</Text>
            </LinearGradient>

          {/* Title & Rating */}
          <View style={styles.infoSection}>
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {businessName}
            </Text>
            <View style={styles.rating}>
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              <StarSVGComponent width={wp("4%")} height={wp("4%")} />
            </View>
          </View>

          {/* Trust Badges */}
          <View style={styles.trustContainer}>
            {hasNoComplaints && (
              <View style={styles.badge}>
                <TickSVGComponent width={wp("4%")} height={wp("4%")} />
                <Text style={styles.badgeText}>
                  Last 100 Orders Without Complaints
                </Text>
              </View>
            )}
            {isBestseller && (
              <View style={styles.badge}>
                <TickSVGComponent width={wp("4%")} height={wp("4%")} />
                <Text style={styles.badgeText}>Bestseller</Text>
              </View>
            )}
            {isFrequentlyReordered && (
              <View style={styles.badge}>
                <TickSVGComponent width={wp("4%")} height={wp("4%")} />
                <Text style={styles.badgeText}>Frequently Reordered</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default ShopOutline;

const styles = StyleSheet.create({
  container: {
    marginHorizontal:wp("2%"),
    flex: 1,
    alignItems: "center",
    paddingVertical: hp("1.5%"),
    backgroundColor:"#fff",
    borderRadius:wp("5%"),
    borderWidth:1,
    borderColor:"#ECECEC"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: wp("5%"),
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,

  },
  image: {
    width: "100%",
    borderRadius:15
  },
  deliveryBadge: {
    position: "absolute",
    borderRadius: wp("20%"),
    flexDirection: "row",
    alignItems: "center",
    borderColor:"#fff",
    borderWidth:hp('0.05%'),
    margin:hp("2%"),
   
  },
  deliveryText: {
    paddingVertical:hp("0.8%"),
    paddingHorizontal:wp("2%"),
    fontSize: wp("3.5%"),
    fontWeight: "500",

    color: "#4A4A4A",
    fontFamily: "DMSans-Medium",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: wp("4%"),
    paddingTop: hp("1.2%"),
  },
  title: {
    fontSize: wp("4.5%"),
    fontWeight: "500",
    fontFamily: "DMSans-Medium",
    color: "#000",
    flex: 1,
    marginRight: wp("2%"),
  },
  rating: {
    backgroundColor: "#156739",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: wp("2%"),
    paddingVertical: hp("0.5%"),
    borderRadius: wp("2%"),
  },
  ratingText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: wp("4%"),
  
  },
  trustContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("1.5%"),
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E7E7E7",
    paddingHorizontal: wp("3%"),
    paddingVertical: hp("0.6%"),
    borderRadius: 50,
    marginRight: wp("2%"),
    marginBottom: hp("1%"),
  },
  badgeText: {
    fontSize: wp("3.5%"),
    fontWeight: "500",
    fontFamily: "DMSans-Medium",
    color: "#6d717c",
    marginLeft: wp("1%"),
  },
});
