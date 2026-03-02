import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import enTranslations from "./locales/en.json";
import frTranslations from "./locales/fr.json";
import jaTranslations from "./locales/ja.json";
import zhTranslations from "./locales/zh.json";
import zhTWTranslations from "./locales/zh-TW.json";

const resources = {
	en: {
		translation: enTranslations,
	},
	zh: {
		translation: zhTranslations,
	},
	"zh-TW": {
		translation: zhTWTranslations,
	},
	fr: {
		translation: frTranslations,
	},
	ja: {
		translation: jaTranslations,
	},
};

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: "en",
		debug: import.meta.env.DEV,
		interpolation: {
			escapeValue: false,
		},
		detection: {
			order: ["localStorage", "navigator", "htmlTag"],
			caches: ["localStorage"],
			lookupLocalStorage: "i18nextLng",
		},
	});

export default i18n;
