import { defineComponent, onMounted } from 'vue';

import { syncTheme, theme, toggleTheme } from '@/stores/theme';

import BrandLogo from './BrandLogo';

import '@/styles/chrome.css';

export default defineComponent({
  name: 'SiteHeader',
  setup() {
    onMounted(syncTheme);

    return () => (
      <header class='site-header'>
        <div class='site-brand'>
          <BrandLogo />
          <h1 class='site-title'>Sudoku</h1>
        </div>
        <button
          type='button'
          class='theme-toggle'
          aria-pressed={theme.isDark}
          onClick={toggleTheme}
        >
          Dark mode
        </button>
      </header>
    );
  },
});
