'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { Locale, defaultLocale, isValidLocale } from '@/lib/i18n';

// Static imports — always available synchronously, no dynamic loading needed
import enMessages from '@/messages/en.json';
import esMessages from '@/messages/es.json';

const messagesMap: Record<Locale, AbstractIntlMessages> = {
  en: enMessages as AbstractIntlMessages,
  es: esMessages as AbstractIntlMessages,
};

const LOCALE_STORAGE_KEY = 'fittrack_locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

interface LocaleProviderProps {
  children: React.ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps): React.ReactElement {
  // Always start with defaultLocale to match SSR output (no hydration mismatch)
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // After mount, silently sync locale from localStorage — no loading screen needed
  // because messages are statically imported and always available
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && isValidLocale(stored) && stored !== defaultLocale) {
        setLocaleState(stored as Locale);
      }
    } catch (_e) {
      // localStorage unavailable — stay with default
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch (_e) {
      // ignore
    }
    setLocaleState(newLocale);
  }, []);

  const messages = messagesMap[locale] ?? messagesMap[defaultLocale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
