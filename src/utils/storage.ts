/**
 * Type-safe storage wrapper
 */

export const storage = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const item = window.localStorage.getItem(`wabi_${key}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(`wabi_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error', e);
    }
  },

  remove(key: string): void {
    try {
      window.localStorage.removeItem(`wabi_${key}`);
    } catch (e) {
      console.error('Storage remove error', e);
    }
  },

  clear(): void {
    try {
      const keys = Object.keys(window.localStorage).filter(k => k.startsWith('wabi_'));
      keys.forEach(k => window.localStorage.removeItem(k));
    } catch (e) {
      console.error('Storage clear error', e);
    }
  }
};
