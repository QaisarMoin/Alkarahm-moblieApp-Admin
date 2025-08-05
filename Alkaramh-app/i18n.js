import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './Utils/translater/en.json';
import ar from './Utils/translater/ar.json';

const LANGUAGE_KEY = 'APP_LANGUAGE';

const languageDetector = {
  type: 'languageDetector',
  async: true,
  detect: async (callback) => {
    try {
      const savedLang = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLang) {
        callback(savedLang);
      } else {
        const deviceLang = Localization.locale.split('-')[0];
        callback(deviceLang || 'en');
      }
    } catch (e) {
      console.log('Language detection error:', e);
      callback('en');
    }
  },
  init: () => {},
  cacheUserLanguage: (lng) => {
    AsyncStorage.setItem(LANGUAGE_KEY, lng);
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
