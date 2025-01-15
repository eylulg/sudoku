import { defineComponent } from 'vue';

import SudokuPuzzle from './views/SudokuPuzzle';

export default defineComponent({
  name: 'App',
  setup() {
    return () => <SudokuPuzzle />;
  },
});
