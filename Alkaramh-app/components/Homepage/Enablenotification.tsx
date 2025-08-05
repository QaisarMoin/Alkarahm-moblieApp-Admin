import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import i18n from "@/i18n";

interface Props {
  isLoading: boolean;
  onEnableNotifications: () => void;
  onRemindLater?: () => void;
}
const EnableNotificationPrompt: React.FC<Props> = ({
  isLoading,
  onEnableNotifications,
  onRemindLater,
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.content}>
      <View style={styles.contentContainer}>
        <Image
          source={require("../../assets/bell_icon.png")}
          style={styles.bellIcon}
          resizeMode="contain"
        />
        <Text style={styles.title}>
          {t("Notification.Don't miss a beat")}
        </Text>
        <Text style={styles.subtitle}>
          {t("Notification.Get notified about Due date , discounts and deals")}
        </Text>

        <TouchableOpacity
          style={[styles.enableButton, isLoading && styles.disabledButton]}
          onPress={onEnableNotifications}
          disabled={isLoading}
        >
          <Text style={styles.enableButtonText}>
            {isLoading ? "Processing..." : t("Notification.Enable Notifications")}
          </Text>
        </TouchableOpacity>

        {onRemindLater && (
          <TouchableOpacity
            onPress={onRemindLater}
            style={styles.remindLaterButton}
          >
            <Text style={styles.remindLater}>
              {t("Notification.remind me later")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp("5%"),
    marginTop: hp("2%"),
  },
  contentContainer: {
    backgroundColor: "#fff",
    borderRadius: wp("6%"),
    paddingVertical: hp("3%"),
    paddingHorizontal: wp("6%"),
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: wp("2%"),
    width: "100%",
  },
  bellIcon: {
    width: wp("50%"),
    height: wp("50%"),
    marginBottom: hp("2%"),
  },
  title: {
    fontSize: wp("5%"),
    fontWeight: "bold",
    marginBottom: hp("1%"),
    textAlign: "center",
    color: "#000",
  },
  subtitle: {
    fontSize: wp("3.7%"),
    color: "#666",
    textAlign: "center",
    marginBottom: hp("3%"),
    lineHeight: hp("2.8%"),
  },
  enableButton: {
    backgroundColor: "#283593",
    paddingVertical: hp("1.7%"),
    paddingHorizontal: wp("10%"),
    borderRadius: hp("3%"),
    minWidth: wp("60%"),
    alignItems: "center",
    marginBottom: hp("1.5%"),
  },
  disabledButton: {
    backgroundColor: "#666",
  },
  enableButtonText: {
    color: "#fff",
    fontSize: wp("4%"),
    fontWeight: "600",
  },
  remindLaterButton: {
    padding: hp("1%"),
  },
  remindLater: {
    color: "#666",
    fontSize: wp("3.5%"),
  },
});

export default EnableNotificationPrompt;
