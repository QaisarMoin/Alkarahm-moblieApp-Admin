import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEY = "userAddresses";

export interface Address {
  _id: string;
  street: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export const loadStoredAddresses = async (): Promise<Address[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (json) {
      return JSON.parse(json);
    }
  } catch (error) {
    console.error("Failed to load addresses:", error);
  }
  return [];
};
