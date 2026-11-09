import { defineComponent } from 'vue';

import SudokuPuzzle from './views/SudokuPuzzle';

export default defineComponent({
  name: 'App',
  setup() {
    return () => (
      <main>
        <h1 class='visually-hidden'>Sudoku</h1>
        <SudokuPuzzle />
      </main>
    );
  },
});
