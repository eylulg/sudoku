import { defineComponent } from 'vue';

import AvailableDigits from '@/components/AvailableDigits';
import SudokuGrid from '@/components/SudokuGrid';
import DifficultySelector from '@/components/DifficultySelector';
import Leaderboard from '@/components/Leaderboard';
import Timer from '@/components/Timer';

import { redo, sudokuPuzzle, undo, useHint } from '@/stores/sudokuPuzzle';

import { MAX_HINTS } from '@/constants/sudoku';

import '@/styles/sudoku-puzzle.css';

export default defineComponent({
  name: 'SudokuPuzzle',
  setup() {
    return () => (
      <>
        <div class='actions-container'>
          <DifficultySelector />

          <p class='score'>
            <b>Score:</b> {sudokuPuzzle.score}
          </p>

          <Timer />

          <div class='action-buttons'>
            <button
              class='undo-button'
              onClick={undo}
              disabled={sudokuPuzzle.history.length === 0}
            >
              ↩ Undo
            </button>
            <button
              class='redo-button'
              onClick={redo}
              disabled={sudokuPuzzle.future.length === 0}
            >
              Redo ↪
            </button>
          </div>

          <button
            class='hint-button'
            onClick={useHint}
            disabled={
              sudokuPuzzle.hintsUsed >= MAX_HINTS ||
              sudokuPuzzle.difficulty === ''
            }
          >
            💡 Hint ({MAX_HINTS - sudokuPuzzle.hintsUsed})
          </button>
        </div>

        <div class='sudoku-puzzle-container'>
          <div class='sudoku-container'>
            <SudokuGrid />
            <AvailableDigits />
          </div>
          <div class='leaderboard-container'>
            <Leaderboard />
          </div>
        </div>
      </>
    );
  },
});
