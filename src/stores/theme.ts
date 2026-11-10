import { reactive } from 'vue';

import { darkModeClass, themeStorageKey } from '@eylulg/ui/theme-script';

export const theme = reactive({ isDark: false });

// The init script in index.html has already set the class before first paint.
export const syncTheme = () => {
  theme.isDark = document.documentElement.classList.contains(darkModeClass);
};

export const toggleTheme = () => {
  theme.isDark = !theme.isDark;
  document.documentElement.classList.toggle(darkModeClass, theme.isDark);
  document.documentElement.style.colorScheme = theme.isDark ? 'dark' : 'light';

  try {
    localStorage.setItem(themeStorageKey, theme.isDark ? 'dark' : 'light');
  } catch {
    // Storage can be blocked; the choice still applies for this visit.
  }
};
