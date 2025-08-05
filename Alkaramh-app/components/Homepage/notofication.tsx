import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  StatusBar,
  ScrollView,
  Linking,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import * as Notifications from "expo-notifications";
import moment from "moment";
import { API_URL } from "../../api.json";
import EnableNotificationPrompt from "./Enablenotification";
import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AuthContext from "@/context/AuthContext";
import { Platform } from "react-native";

interface NotificationProps {
  onEnableNotifications?: () => Promise<void>;
  onRemindLater?: () => Promise<void>;
  title?: string;
  subtitle?: string;
  enableButtonText?: string;
  remindLaterText?: string;
  showRemindLater?: boolean;
}

const NotificationScreen: React.FC<NotificationProps> = ({
  onEnableNotifications,
  onRemindLater,
  title = "Don't miss a beat",
  subtitle = "Get notified about Due date, discounts and deals",
  enableButtonText = "Enable Now",
  remindLaterText = "Remind me later",
  showRemindLater = true,
}) => {
  const authcontext = useContext(AuthContext);
  const { user, token } = authcontext || {};

  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [tab, setTab] = useState<"all" | "unread" | "read">("all");
  const [notifications, setNotifications] = useState<any[]>([]);

  // Remove notification listeners. Only manage FCM token refresh if necessary.
  useEffect(() => {
    const unsubscribeToken = messaging().onTokenRefresh(token => {
      console.log('🔄 FCM Token Refreshed:', token);
      AsyncStorage.setItem('fcmToken', token);
    });
    return unsubscribeToken;
  }, []);

  // Load notifications from AsyncStorage on focus
  useFocusEffect(
    React.useCallback(() => {
    const loadNotifications = async () => {
      try {
        const stored = await AsyncStorage.getItem("notifications");
        console.log('[NotificationScreen] Loaded notifications from AsyncStorage:', stored);
        const parsed = stored ? JSON.parse(stored) : [];
        setNotifications(parsed.reverse());
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };
    loadNotifications();
    }, [])
  );

  useEffect(() => {
    const checkPermission = async () => {
      const settings = await Notifications.getPermissionsAsync();
      setIsEnabled(
        settings.granted ||
          settings.ios?.status ===
            Notifications.IosAuthorizationStatus.AUTHORIZED
      );
    };

    checkPermission();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const loadNotifications = async () => {
        try {
          const stored = await AsyncStorage.getItem("notifications");
          const parsed = stored ? JSON.parse(stored) : [];
          setNotifications(parsed.reverse());
          await AsyncStorage.setItem("notifications", JSON.stringify(parsed));
        } catch (error) {
          console.error("Failed to load notifications", error);
        }
      };

      loadNotifications();
    }, [])
  );

  const handleEnableNotifications = async (): Promise<void> => {
    setIsLoading(true);
    try {
      let granted = false;
      if (Platform.OS === 'ios') {
        await messaging().registerDeviceForRemoteMessages();
        const authStatus = await messaging().requestPermission();
        granted =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      } else {
        const settings = await Notifications.requestPermissionsAsync();
        granted =
          settings.granted ||
          settings.android?.status === Notifications.IosAuthorizationStatus.AUTHORIZED;
      }

      if (granted) {
        setIsEnabled(true);
        let fcmToken = await messaging().getToken();
        if (!fcmToken && Platform.OS === 'ios') {
          // Try again after a short delay
          await new Promise(res => setTimeout(res, 1000));
          fcmToken = await messaging().getToken();
        }
        console.log('📱 FCM Token:', fcmToken);
        await AsyncStorage.setItem('fcmToken', fcmToken);
        
        const response = await fetch(`${API_URL}/auth/update-fcm-token`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },

          body: JSON.stringify({ userId:user?._id,fcmToken:fcmToken }),

        });
        const data = await response.json();
        console.log('📱 FCM Token Updated:', data);
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications from system settings.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to enable notifications.');
      console.error('Enable Notification Error:', error);
    }
    setIsLoading(false);
  };

  const handleRemindLater = async (): Promise<void> => {
    try {
      if (onRemindLater) {
        await onRemindLater();
      } else {
        Alert.alert("Reminder Set", "We'll remind you later.");
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to set reminder.");
      console.error("Remind later error:", error);
    }
  };

  // Filter notifications by tab
  const filteredNotifications = notifications.filter((n) => {
    if (tab === "unread") return !n.read;
    if (tab === "read") return n.read;
    return true;
  });

  // Toggle read/unread on tap
  const toggleRead = async (id: string) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: !n.read } : n
    );
    setNotifications(updated);
    await AsyncStorage.setItem('notifications', JSON.stringify(updated));
  };

  const groupByDate = (list: any[]) => {
    const groups: { [key: string]: any[] } = {};
    list.forEach((item) => {
      const date = moment(item.date || item.receivedAt).startOf("day");
      const label = moment().isSame(date, "day")
        ? "Today"
        : moment().subtract(1, "day").isSame(date, "day")
        ? "Yesterday"
        : date.format("DD MMM YYYY");

      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    });
    return groups;
  };

  const groupedNotifications = groupByDate(filteredNotifications);

  // Save notifications to AsyncStorage whenever they change
  useEffect(() => {
    AsyncStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleClearAll = async () => {
    console.log(await AsyncStorage.getItem("fcmToken"));
    setNotifications([]);
    await AsyncStorage.removeItem("notifications");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F3F4F8" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {isEnabled ? (
            <>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: wp("5%"),
                }}
              >
                <View style={styles.tabContainer}>
                  {["all", "unread", "read"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => setTab(type as any)}
                      style={[
                        styles.tabButton,
                        tab === type && styles.activeTabButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tabText,
                          tab === type && styles.activeTabText,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity onPress={handleClearAll}>
                  <Text
                    style={{
                      color: "#C62828",
                      fontWeight: "600",
                      fontSize: wp("4%"),
                    }}
                  >
                    Clear All
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ paddingHorizontal: wp("5%") }}>
                {Object.entries(groupedNotifications).length === 0 ? (
                  <Text
                    style={{
                      textAlign: "center",
                      color: "#666",
                      fontSize: wp("4%"),
                      marginTop: hp("5%"),
                    }}
                  >
                    No notifications found.
                  </Text>
                ) : (
                  Object.entries(groupedNotifications).map(([date, items]) => (
                    <View key={date} style={{ marginBottom: hp("2%") }}>
                      <Text
                        style={{
                          fontWeight: "700",
                          fontSize: wp("4.5%"),
                          marginBottom: hp("1%"),
                          marginTop: hp("1%"),
                        }}
                      >
                        {date}
                      </Text>

                      {items.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.notificationCard, !item.read && { borderLeftWidth: 4, borderLeftColor: '#283593' }]}
                          onPress={() => toggleRead(item.id)}
                        >
                          <Text style={[styles.notificationTitle, !item.read && { fontWeight: 'bold', color: '#283593' }]}> 
                            {item.title}
                            {!item.read && <Text style={{ color: '#283593' }}> •</Text>}
                          </Text>
                          <Text style={styles.notificationMsg}>
                            {item.message}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ))
                )}
              </View>
            </>
          ) : (
            <EnableNotificationPrompt
              isLoading={isLoading}
              onEnableNotifications={handleEnableNotifications}
              onRemindLater={handleRemindLater}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FB",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F6FB",
    marginBottom: hp("5%"),
    marginTop: hp("1%"),
  },
  tabContainer: {
    flexDirection: "row",
    gap: wp("2%"),
  },
  tabButton: {
    paddingVertical: hp("1%"),
    paddingHorizontal: wp("5%"),
    borderRadius: wp("5%"),
    borderWidth: 1,
    borderColor: "#ccc",
  },
  activeTabButton: {
    backgroundColor: "#283593",
  },
  tabText: {
    fontSize: wp("4%"),
    color: "#000",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#fff",
  },
  notificationCard: {
    backgroundColor: "#fff",
    padding: hp("2%"),
    borderRadius: wp("3%"),
    marginBottom: hp("1.5%"),
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationTitle: {
    fontSize: wp("4%"),
    fontWeight: "bold",
    color: "#000",
  },
  notificationMsg: {
    fontSize: wp("3.6%"),
    color: "#444",
    marginTop: hp("0.5%"),
  },
});

export default NotificationScreen;
