import { defineComponent } from 'vue';

import SiteFooter from './components/SiteFooter';
import SiteHeader from './components/SiteHeader';
import SudokuPuzzle from './views/SudokuPuzzle';

export default defineComponent({
  name: 'App',
  setup() {
    return () => (
      <>
        <SiteHeader />
        <main>
          <SudokuPuzzle />
        </main>
        <SiteFooter />
      </>
    );
  },
});
