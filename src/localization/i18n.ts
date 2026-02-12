import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { translations } from "./translations";

void i18next.use(initReactI18next).init({
  resources: translations,
  lng: "no",
  fallbackLng: "no",
  showSupportNotice: false,
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: "v4",
});

export default i18next;
