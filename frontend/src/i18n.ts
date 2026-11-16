import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import vi from './locales/vi.json'

// Every UI string goes through t('...'). Vietnamese is the only language for now;
// adding English later means adding locales/en.json and a language switcher.
void i18n.use(initReactI18next).init({
  resources: { vi: { translation: vi } },
  lng: 'vi',
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
})

export default i18n
