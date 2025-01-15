import { computed, defineComponent } from 'vue';

import {
  checkAndFinishGame,
  setActiveCell,
  sudokuPuzzle,
  updateCell,
} from '@/stores/sudokuPuzzle';

import { SUDOKU_GRID_SIZE } from '@/constants/sudoku';

import '@/styles/available-digits.css';

export default defineComponent({
  name: 'AvailableDigits',
  setup() {
    const availableDigits = computed(() =>
      Array.from({ length: SUDOKU_GRID_SIZE }, (_, i) => i + 1),
    );

    const getDigitUsageCounts = computed(() => {
      const digitCounts: Record<number, number> = availableDigits.value.reduce(
        (counts, digit) => {
          counts[digit] = 0;
          return counts;
        },
        {} as Record<number, number>,
      );

      sudokuPuzzle.grid.forEach((row) => {
        row.forEach((cell) => {
          if (cell.value !== null) {
            digitCounts[cell.value]++;
          }
        });
      });

      return digitCounts;
    });

    const isDigitAvailableForSelection = (digit: number) => {
      return getDigitUsageCounts.value[digit] < SUDOKU_GRID_SIZE;
    };

    const handleDigitSelection = (digit: number) => {
      const { row, col } = sudokuPuzzle.activeCell;

      if (row !== null && col !== null && digit) {
        updateCell(row, col, digit);
        setActiveCell(null, null);
        checkAndFinishGame();
      }
    };

    return () => (
      <div class='available-digits'>
        {availableDigits.value.map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigitSelection(digit)}
            class={{
              'digit-box': true,
              'digit-grayed': isDigitAvailableForSelection(digit),
            }}
            disabled={
              !isDigitAvailableForSelection(digit) ||
              sudokuPuzzle.difficulty === ''
            }
          >
            {digit}
          </button>
        ))}
      </div>
    );
  },
});
