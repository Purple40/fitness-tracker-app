'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { Locale, defaultLocale, isValidLocale } from '@/lib/i18n';

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

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null);
  const [mounted, setMounted] = useState(false);

  // Load locale from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    const resolved = stored && isValidLocale(stored) ? stored : defaultLocale;
    setLocaleState(resolved);
    setMounted(true);
  }, []);

  // Load messages whenever locale changes
  useEffect(() => {
    if (!mounted) return;
    import(`@/messages/${locale}.json`)
      .then((mod) => setMessages(mod.default as AbstractIntlMessages))
      .catch(() => {
        // Fallback to English
        import('@/messages/en.json').then((mod) => setMessages(mod.default as AbstractIntlMessages));
      });
  }, [locale, mounted]);

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    setLocaleState(newLocale);
  }, []);

  // Render nothing until mounted (avoids hydration mismatch)
  if (!mounted || !messages) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading FitTrack...</p>
        </div>
      </div>
    );
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
