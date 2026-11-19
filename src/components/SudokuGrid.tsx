import { defineComponent, nextTick, ref } from 'vue';

import SudokuCell, { type CellDirection } from './SudokuCell';

import { sudokuPuzzle } from '@/stores/sudokuPuzzle';

import { SUDOKU_GRID_SIZE } from '@/constants/sudoku';

import '@/styles/sudoku-grid.css';

const STEPS: Record<CellDirection, [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

const clamp = (value: number) => Math.min(Math.max(value, 0), SUDOKU_GRID_SIZE - 1);

export default defineComponent({
  name: 'SudokuGrid',
  setup() {
    // Roving tab stop: only one cell is in the tab order, and the arrow keys
    // move between cells.
    const focused = ref({ row: 0, col: 0 });

    const applyBorderBottom = (rowIndex: number, gridLength: number) => {
      return rowIndex % 3 === 2 && rowIndex !== gridLength - 1;
    };

    const handleCellFocus = (row: number, col: number) => {
      focused.value = { row, col };
    };

    const navigate = async (direction: CellDirection) => {
      const [rowStep, colStep] = STEPS[direction];
      const row = clamp(focused.value.row + rowStep);
      const col = clamp(focused.value.col + colStep);
      focused.value = { row, col };
      await nextTick();
      document.getElementById(`cell-${row}-${col}`)?.focus();
    };

    return () => (
      <>
        <div class='grid-container'>
          {sudokuPuzzle.difficulty === '' && (
            <div class='overlay'>
              <span class='overlay-message'>Choose a difficulty to start</span>
            </div>
          )}
          <div
            class='grid'
            role='group'
            inert={sudokuPuzzle.difficulty === ''}
            aria-label='Sudoku grid. Use the arrow keys to move between cells.'
          >
            {sudokuPuzzle.grid.map((row, rowIndex) => (
              <div
                key={rowIndex}
                class={[
                  'grid-row',
                  applyBorderBottom(rowIndex, sudokuPuzzle.grid.length) ? 'border-bottom' : '',
                ]}
              >
                {row.map((cell, colIndex) => (
                  <SudokuCell
                    key={colIndex}
                    cell={cell}
                    rowLength={row.length}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
                    isTabStop={focused.value.row === rowIndex && focused.value.col === colIndex}
                    onNavigate={navigate}
                    onCellFocus={handleCellFocus}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  },
});
