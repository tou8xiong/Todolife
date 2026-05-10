import { translations, Locale } from "@/locales/translations";

/**
 * Get translation for a specific key path
 * Supports nested keys like "backgroundRemoval.buttons.removeBackground"
 */
export function getTranslation(locale: Locale, keyPath: string): string {
  const keys = keyPath.split('.');
  let value: any = translations[locale];

  for (const key of keys) {
    value = value?.[key];
  }

  return typeof value === 'string' ? value : keyPath;
}

/**
 * Format translation with dynamic values
 * Example: formatTranslation("Hello {name}", { name: "John" }) => "Hello John"
 */
export function formatTranslation(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}

/**
 * Get validation message with field name
 */
export function getValidationMessage(locale: Locale, type: string, fieldName?: string): string {
  const t = translations[locale];
  const message = t.forms?.validation?.[type as keyof typeof t.forms.validation] || '';
  return fieldName ? `${fieldName}: ${message}` : message;
}
