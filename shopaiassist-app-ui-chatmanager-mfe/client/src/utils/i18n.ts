import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import translations from '../../public/locales/en/common.json';

const i18nInstance = i18n.createInstance();

i18nInstance.use(initReactI18next).init({
  resources: {
    en: {
      translation: translations
    }
    // other languages...
  },
  lng: 'en', // default language
  fallbackLng: 'en', // fallback language when key not found

  interpolation: {
    escapeValue: false
  }
});

export default i18nInstance;
