import { StyleSheet, I18nManager } from "react-native";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";


export const Cartstyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F6FC",

  },
  container: {
    flex: 1,
    paddingHorizontal: wp("4%"),
    backgroundColor: "#F5F6FC",
    height:hp("100%"),
    paddingBottom: hp("12%"), // add this line
  },
  header: {

    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    marginBottom: 0,
    marginTop: hp("2.5%"),
  },
  headerTitle: {
    
    fontSize: wp("5%"),
    fontWeight: "600",
    marginLeft: I18nManager.isRTL ? 0 : wp("2%"),
    marginRight: I18nManager.isRTL ? wp("2%") : 0,
  },
  addressRow: {
    flexDirection: I18nManager.isRTL ? "row-reverse" : "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: wp("3%"),
    paddingVertical:hp("3%"),
    marginTop: hp("2%"),
  },
  addressText: {
    marginHorizontal: wp("2%"),
    color: "#283593",
    fontWeight: "500",
    flex: 1,
  },
  cartCard: {
    borderRadius: 16,
    padding: wp("2%"),
    paddingVertical:hp("2%"),
    flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    borderBottomWidth:hp("0.2%"),
    borderColor: "#e8e8e8",


  
  },
  cartItemBox: {

    borderRadius: 10,
    backgroundColor: "#fff",
    flex: 1,
 
  },
  cartItemLine: {
    borderWidth: 1,
    borderColor: "#e8e8e8",
    width: wp("100%"),
  },
  cartImage: {
    width: wp('25%'),
    height: wp('25%'),
    borderRadius: 10,
    backgroundColor: "#f4f4f4",
  },
  cardImageBox: {
    paddingVertical:hp("2%"),
    paddingHorizontal:wp("6%"),
    backgroundColor: "#F3F5F9",
    borderWidth:1,
    borderColor:"#E8E8E8",
    
   
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  quantityBtn:{
    backgroundColor:"#F5F6FC",
    padding:wp("1%"),
    borderRadius:100,

  },
  productDetailsContainer: {

    flex: 1,
    marginLeft: I18nManager.isRTL ? 0 : wp("5%"),
    marginRight: I18nManager.isRTL ? wp("5%") : 0,
  },
  productInfoBlock: {
    marginBottom: hp("1%"),
  },
  cartName: {
    fontSize: wp('3.5%'),
    fontWeight: "800",
    color: "#333",
    flex: 1,
    marginRight: wp("2%"),
    marginBottom: hp("0.5%"),
  },
  productDesc: {
    fontSize: wp('3.5%'),
    color: '#666',
    marginBottom: hp("0.5%"),
  },
  priceText: {
    fontSize: wp('3.5%'),
    fontWeight: 'bold',
    color: '#00000',
    marginBottom: hp("0.5%"),
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: wp("2%"),
  },
  quantityInput: {
    paddingVertical: hp('0.5%'),
    paddingHorizontal: wp('1%'),
    fontSize: wp('3.5%'),
    fontWeight: '500',
    color: '#666',
    minWidth: wp('5%'),
    textAlign: 'center',
  },
  deleteBtn: {
    position: 'absolute',
    [I18nManager.isRTL ? 'left' : 'right']: wp("2%"),
    padding: wp("1%"),
    backgroundColor: "#fee0e3",
    borderRadius: wp("20%"),
    alignItems: "center",
    justifyContent: "center",
    width: wp("8%"),
    height: wp("8%"),
  },
  checkoutBtnUltraWrapper: {
    position: "absolute",
    left: wp("5%"),
    right: wp("5%"),
    bottom: hp("0%"),
    paddingHorizontal: wp("2%"),
    paddingTop: hp("2%"),
    paddingBottom: hp("2%"),
    zIndex: 10,
  },
  checkoutBtnUltra: {
    backgroundColor: "#283593",
    paddingVertical: hp("2%"),
    borderRadius: wp('4%'),
    alignItems: "center",
    marginHorizontal: 0,
  },
  checkoutText: {
    color: "#fff",
    fontSize: wp("4.2%"),
    fontWeight: "bold",
  },
  locationContainer: {
    position: 'relative',
    zIndex: 1,
    marginBottom:hp('2%')
  },
  locationDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 2,
  },
  locationItem: {
    padding: wp('4%'),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  locationText: {
    fontSize: wp('4%'),
    color: '#333',
  },
  emptyCartContainer:{
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: hp("5%"),
    paddingHorizontal: wp("5%"),
  },
emptyCartCard:{
  backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: hp("5%"),
    paddingHorizontal: wp("5%"),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    width: '100%',
},
  
emptyCartImage:{
  width: wp("70%"),
    height: hp("25%"),
    resizeMode: "contain",
    marginBottom: hp("2%"),
},
emptyCartTitle:{
  fontSize: wp("5%"),
    fontWeight: "bold",
    color: "#333",
    marginBottom: hp("1%"),
},
exploreButton: {
    backgroundColor: "#283593",
    paddingVertical: hp("1.5%"),
    borderRadius: 12,
    paddingHorizontal: wp("20%"),
    width: "100%",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
  },
    emptyCartSubtitle: {
    fontSize: wp("4%"),
    color: "#666",
    textAlign: "center",
    marginBottom: hp("3%"),
    paddingHorizontal: wp("5%"),
  },
  exploreButtonText: {
    color: "#fff",
    fontSize: wp("4.2%"),
    fontWeight: "bold",
    textAlign: "center",
      width: "100%" ,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

 modalContainer: {
  backgroundColor: "white",
  justifyContent:"center",
  alignItems:"center",
},


  trashIconContainer: {
  top:-wp("10%"),
  position: "absolute",
  width: wp("16%"),
  height: wp("16%"),
  borderRadius: wp("8%"),
  backgroundColor: "#FFEBEE",


  justifyContent: 'center',
  alignItems: 'center',
  elevation: 6,

  },
  modalTitle: {
    fontSize: wp("4.5%"),
    fontWeight: "600",
    textAlign: "center",
    marginTop:hp("4%"),
    color: "#333",
  },
  modalErrorText: {
    color: "red",
    textAlign: "center",
    marginBottom: hp("1.5%"),
    fontSize: wp("3.8%"),
  },
  modalButtons: {
    width: "100%",
    marginTop: hp("2%"),
  },
  cancelBtn: {
    backgroundColor: "#F67475",
    paddingVertical: hp("1.5%"),
    paddingHorizontal:wp("15%"),
    borderRadius: wp("2.5%"),
    alignItems: "center",
    marginBottom: hp("1.2%"),
  },
  cancelText: {
    color: "white",
    fontWeight: "600",
    fontSize: wp("4%"),
  },
  confirmBtn: {
    backgroundColor: "#E5E7EB",
    paddingVertical: hp("1.5%"),
    paddingHorizontal:wp("15%"),
    borderRadius: wp("2.5%"),
    alignItems: "center",
  },
  confirmBtnDisabled: {
    backgroundColor: "#FCA5A5",
  },
  confirmText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: wp("4%"),
  },
  manageAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp("2%"),
    paddingHorizontal: wp("4%"),
    paddingVertical: hp("1%"),
  },
  manageAddressText: {
    marginLeft: wp("1%"),
    fontSize: wp("3.8%"),
    color: "#3B82F6",
  },
 
  guestBanner: {
    backgroundColor: '#FFF3CD',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 10,
    borderColor: '#FFEEBA',
    borderWidth: 1,
  },
  
  guestBannerText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  
  fullWidthCTA: {
    flexDirection: 'row',
    backgroundColor: '#1E88E5',
    paddingVertical: 14,
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  fullWidthCTAText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6FC',
  },
  errorText: {
    color: '#856404',
    textAlign: 'center',
    fontSize: wp('4%'),
    marginTop: 20,
    paddingHorizontal: 24,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  
});