'use client';

import { useLocale } from '@/components/providers/LocaleProvider';
import { locales, localeNames, localeFlags, Locale } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 rounded-full"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-10 z-50 min-w-[140px] rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-fade-in">
          {locales.map((l: Locale) => (
            <button
              key={l}
              onClick={() => {
                setLocale(l);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-accent ${
                locale === l
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-foreground'
              }`}
            >
              <span className="text-base">{localeFlags[l]}</span>
              <span>{localeNames[l]}</span>
              {locale === l && (
                <span className="ml-auto text-primary text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
