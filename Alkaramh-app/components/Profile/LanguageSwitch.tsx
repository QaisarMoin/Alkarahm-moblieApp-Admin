import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, I18nManager, StatusBar, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';

const LanguageSwitch: React.FC = () => {
  const { i18n, t } = useTranslation();

  const currentLang = i18n.language === 'ar' ? 'ar' : 'en';

  const handleSwitch = async (lang: string) => {
    if (i18n.language !== lang) {
      Alert.alert(
        t("LanguageSwitch.Restart Required"),
        t("LanguageSwitch.The app will restart to apply language changes."),
        [
          {
            text: t("LanguageSwitch.OK"),
            onPress: async () => {
              await i18n.changeLanguage(lang);
              if (lang === 'ar') {
                I18nManager.forceRTL(true);
              } else {
                I18nManager.forceRTL(false);
              }
              Updates.reloadAsync();
            }
          },
          { text: t("LanguageSwitch.Cancel"), style: "cancel" }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F3F4F8" />

        <Text style={styles.title}>{t('LanguageSwitch.title')}</Text>
      <View style={styles.switchContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            currentLang === 'en' && styles.selectedButton,
          ]}
          onPress={() => handleSwitch('en')}
        >
          <Ionicons name="language" size={20} color={currentLang === 'en' ? '#fff' : '#333'} />
          <Text style={[styles.buttonText, currentLang === 'en' && styles.selectedText]}>
            {t('LanguageSwitch.English')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            currentLang === 'ar' && styles.selectedButton,
          ]}
          onPress={() => handleSwitch('ar')}
        >
          <Ionicons name="language" size={20} color={currentLang === 'ar' ? '#fff' : '#333'} />
          <Text style={[styles.buttonText, currentLang === 'ar' && styles.selectedText]}>
            {t('LanguageSwitch.Arabic')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};      


const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F3F3F8',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 32,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 8,
  },
  selectedButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedText: {
    color: '#fff',
  },
});

export default LanguageSwitch;
