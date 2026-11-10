import { defineComponent, onMounted } from 'vue';

import { syncTheme, theme, toggleTheme } from '@/stores/theme';

import '@/styles/chrome.css';

export default defineComponent({
  name: 'SiteHeader',
  setup() {
    onMounted(syncTheme);

    return () => (
      <header class='site-header'>
        <h1 class='site-title'>Sudoku</h1>
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
