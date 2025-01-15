import { defineComponent } from 'vue';

import SudokuCell from './SudokuCell';

import { sudokuPuzzle } from '@/stores/sudokuPuzzle';

import '@/styles/sudoku-grid.css';

export default defineComponent({
  name: 'SudokuGrid',
  setup() {
    const applyBorderBottom = (rowIndex: number, gridLength: number) => {
      return rowIndex % 3 === 2 && rowIndex !== gridLength - 1;
    };

    return () => (
      <>
        <div class='grid-container'>
          {sudokuPuzzle.difficulty === '' && (
            <div class='overlay'>
              <span class='overlay-message'>
                Please select a difficulty to start
              </span>
            </div>
          )}
          <div class='grid'>
            {sudokuPuzzle.grid.map((row, rowIndex) => (
              <div
                key={rowIndex}
                class={[
                  'grid-row',
                  applyBorderBottom(rowIndex, sudokuPuzzle.grid.length)
                    ? 'border-bottom'
                    : '',
                ]}
              >
                {row.map((cell, colIndex) => (
                  <SudokuCell
                    key={colIndex}
                    cell={cell}
                    rowLength={row.length}
                    rowIndex={rowIndex}
                    colIndex={colIndex}
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
