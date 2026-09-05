import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import en from "./en.json";
import or from "./or.json";
import hi from "./hi.json";

export const LANG_KEY = "carezoa.language";
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "or", label: "ଓଡ଼ିଆ" },
  { code: "hi", label: "हिन्दी" },
] as const;

export async function applySavedLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANG_KEY);
    const device = getLocales()[0]?.languageCode ?? "en";
    const target = saved ?? (["en", "or", "hi"].includes(device) ? device : "en");
    if (i18n.language !== target) await i18n.changeLanguage(target);
  } catch {
    /* keep default */
  }
}

export async function setLanguage(code: string) {
  await i18n.changeLanguage(code);
  AsyncStorage.setItem(LANG_KEY, code).catch(() => {});
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, or: { translation: or }, hi: { translation: hi } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
