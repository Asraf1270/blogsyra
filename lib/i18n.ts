import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'bn'] as const,
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  localeDetection: true,
})

export type Locale = (typeof routing.locales)[number]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  bn: 'বাংলা',
}

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  bn: 'ltr',
}