import { render, type RenderOptions } from "@testing-library/react";
import { createInstance } from "i18next";
import { initReactI18next, I18nextProvider } from "react-i18next";
import type { PropsWithChildren, ReactElement } from "react";

import de from "../../src/renderer/i18n/locales/de.json";
import en from "../../src/renderer/i18n/locales/en.json";
import es from "../../src/renderer/i18n/locales/es.json";
import fr from "../../src/renderer/i18n/locales/fr.json";
import ja from "../../src/renderer/i18n/locales/ja.json";
import zhTW from "../../src/renderer/i18n/locales/zh-TW.json";
import zh from "../../src/renderer/i18n/locales/zh.json";

const resources = {
  en: { translation: en },
  zh: { translation: zh },
  "zh-TW": { translation: zhTW },
  ja: { translation: ja },
  es: { translation: es },
  de: { translation: de },
  fr: { translation: fr },
};

export async function createTestI18n(language = "en") {
  const i18n = createInstance();
  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
  return i18n;
}

export async function renderWithI18n(
  ui: ReactElement,
  options?: RenderOptions & { language?: keyof typeof resources },
) {
  const i18n = await createTestI18n(options?.language ?? "en");

  function Wrapper({ children }: PropsWithChildren) {
    return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
  }

  return {
    i18n,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}
