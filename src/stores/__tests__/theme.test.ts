import { describe, it, expect, beforeEach, vi } from 'vitest';

import { syncTheme, theme, toggleTheme } from '@/stores/theme';

describe('theme', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    localStorage.clear();
    syncTheme();
  });

  it('switches the dark-mode class on and off and remembers the choice', () => {
    toggleTheme();

    expect(document.documentElement).toHaveProperty('className', 'dark-mode');
    expect(theme.isDark).toBe(true);
    expect(localStorage.getItem('eylulg-ui-theme')).toBe('dark');

    toggleTheme();

    expect(document.documentElement.classList.contains('dark-mode')).toBe(false);
    expect(localStorage.getItem('eylulg-ui-theme')).toBe('light');
  });

  it('starts from the class the init script already set', () => {
    document.documentElement.classList.add('dark-mode');

    syncTheme();

    expect(theme.isDark).toBe(true);
  });

  it('still switches when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => toggleTheme()).not.toThrow();
    expect(theme.isDark).toBe(true);

    vi.restoreAllMocks();
  });
});
