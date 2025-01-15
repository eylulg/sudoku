import { defineComponent } from 'vue';

import { setDifficulty, sudokuPuzzle } from '@/stores/sudokuPuzzle';

import { DIFFICULTIES } from '@/constants/sudoku';

import '@/styles/difficulty-selector.css';

export default defineComponent({
  name: 'DifficultySelector',
  setup() {
    const handleDifficultyChange = (event: Event) => {
      const target = event.target as HTMLSelectElement;
      setDifficulty(target.value as Difficulty);
    };

    return () => (
      <div class='difficulty-selector'>
        <label for='select-difficulty'>Difficulty:</label>
        <select
          id='select-difficulty'
          value={sudokuPuzzle.difficulty}
          onChange={handleDifficultyChange}
        >
          <option value='' disabled>
            Select difficulty
          </option>
          {DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </div>
    );
  },
});
