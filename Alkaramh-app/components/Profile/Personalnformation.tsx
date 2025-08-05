import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { ProfileBGSVGComponent } from '../Homepage/svgs/svgComponents';
import { heightPercentageToDP as hp , widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useNavigation } from '@react-navigation/native';
import { useContext } from 'react';
import AuthContext from '@/context/AuthContext';
import { API_URL } from '@/api.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
const ProfileScreen = () => {
  const navigation = useNavigation();
  const authContext = useContext(AuthContext);
  const { user: contextUser, token, isGuest } = authContext || {};

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    dateOfBirth: '',
  });
  const [editableFields, setEditableFields] = useState({
    name: false,
    email: false,
    mobile: false,
    dateOfBirth: false,
  });
  
  const [canUpdate, setCanUpdate] = useState(false);
  
  useEffect(() => {
    if (contextUser) {
      setFormData({
        name: contextUser.name || '',
        email: contextUser.email || '',
        mobile: contextUser.profile?.phone || '',
        dateOfBirth: contextUser.profile?.dob || '',
      });
    }
  }, [contextUser]);
  const handleMakeEditable = (field) => {
    setEditableFields((prev) => ({ ...prev, [field]: true }));
    setCanUpdate(true);
  };
  
  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          // eslint-disable-next-line camelcase
          phone: formData.mobile,
          // eslint-disable-next-line camelcase
          dob: formData.dateOfBirth,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Update failed');

      const updatedUser = {
        ...contextUser,
        name: formData.name,
        email: formData.email,
        profile: {
          ...contextUser?.profile,
          phone: formData.mobile,
          dob: formData.dateOfBirth,
        },
      };

      await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
      authContext?.loginAction({ user: updatedUser, token });

      Toast.show({
        type: 'success',
        text1: 'Profile Updated',
      });
    } catch (err) {
      console.error(err);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: err.message,
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.svgBackground}>
        <ProfileBGSVGComponent />
      </View>

      <View style={styles.contentContainer}>
        {/* Avatar */}
        <View style={styles.avatarWrapper}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>{isGuest
                  ? "G"
                  : (formData.email?.[0]?.toUpperCase() || "U")}</Text>
        </View>
        </View>

        <View style={styles.card}>
          {/* Name */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Name</Text>
  <TextInput
    style={styles.input}
    value={formData.name}
    onChangeText={(text) => setFormData({ ...formData, name: text })}
    placeholder="Name"
    placeholderTextColor="#000"
  />
</View>

{/* Mobile */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Mobile</Text>
  <View style={styles.rowInput}>
    <TextInput
      style={[styles.inputFlex, { paddingRight: 80 }]}
      value={formData.mobile}
      onChangeText={(text) => setFormData({ ...formData, mobile: text })}
      keyboardType="phone-pad"
      placeholder="Mobile"
    />
    <TouchableOpacity style={styles.changeButton}>
      <Text style={styles.changeText}>CHANGE</Text>
    </TouchableOpacity>
  </View>
</View>

{/* Email */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Email</Text>
  <View style={styles.rowInput}>
    <TextInput
      style={[styles.inputFlex, { paddingRight: 80 }]}
      value={formData.email}
      onChangeText={(text) => setFormData({ ...formData, email: text })}
      placeholder="Email"
    />  
    <TouchableOpacity style={styles.changeButton}>
      <Text style={styles.changeText}>CHANGE</Text>
    </TouchableOpacity>
  </View>
</View>

{/* DOB */}
<View style={styles.inputGroup}>
  <Text style={styles.label}>Date of birth</Text>
  <TextInput
    style={styles.input}
    value={formData.dateOfBirth}
    onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
    placeholder="Date of birth"
    placeholderTextColor="#999"
  />
</View>

{/* Submit Button */}
<TouchableOpacity style={styles.disabledButton} disabled>
  <Text style={styles.disabledButtonText}>Update profile</Text>
</TouchableOpacity>
         
         </View>  
      </View>   
         
      <View style={styles.deleteSection}>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            if (isGuest) {
              Alert.alert(
                'Guest Restricted',
                'Please login or create an account to delete your profile.'
              );
              return;
            }
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                      const response = await fetch(`${API_URL}/auth/me`, {
                        method: 'DELETE',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${token}`,
                        },
                      });
                      const result = await response.json();
                      if (!response.ok) throw new Error(result.message || 'Failed to delete account');
                      Toast.show({ type: 'success', text1: 'Account deleted' });
                      await authContext?.logoutAction();
                      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                    } catch (err: any) {
                      Toast.show({ type: 'error', text1: 'Delete Failed', text2: err.message });
                    }
                  }
                },
              ]
            );
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.deleteButtonText}>Delete Account</Text>
        </TouchableOpacity>
        <Text style={styles.deleteWarningText}>
          This will permanently remove your account and all your data. This action cannot be undone.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FB',
  },
  svgBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop:20,
  },
  header: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginVertical:20,
    marginLeft:-2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#aeb1ba',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor:'#ccc',
    

    
  },
  card: {
  paddingVertical:hp('2%'),
  paddingHorizontal:wp('4%'),
  },
  avatarLetter: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#fff',
  },
  inputGroup: {
    marginBottom: 25,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    top: -10,
    left: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    fontSize: 12,
    color: '#999',
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  rowInput: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  inputFlex: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  changeButton: {
    position: 'absolute',
    right: 15,
    top: 12,
  },
  changeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2A3ED9',
  },
  disabledButton: {
    backgroundColor: '#E1E4ED',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 80,
    alignItems: 'center',
  },
  disabledButtonText: {
    color: '#B1B4BF',
    fontWeight: 'bold',
  }, deleteSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 32,
    paddingTop: 24,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#B71C1C',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 24,
    marginBottom: 10,
    shadowColor: '#B71C1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  deleteWarningText: {
    color: '#B71C1C',
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  
 
});
