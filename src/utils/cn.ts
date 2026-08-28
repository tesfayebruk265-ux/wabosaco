/**
 * Utility for combining class names with conditional falsy filtering
 */
export function cn(...classes: (string | boolean | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
