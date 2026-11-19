import { defineComponent, nextTick, onMounted, ref, watch } from 'vue';

import AvailableDigits from '@/components/AvailableDigits';
import SudokuGrid from '@/components/SudokuGrid';
import DifficultySelector from '@/components/DifficultySelector';
import Leaderboard from '@/components/Leaderboard';
import Timer from '@/components/Timer';

import {
  redo,
  resumeSavedGame,
  setDifficulty,
  sudokuPuzzle,
  undo,
  useHint,
} from '@/stores/sudokuPuzzle';

import { MAX_HINTS } from '@/constants/sudoku';
import { formatDifficulty } from '@/utils/sudokuPuzzle';

import '@/styles/sudoku-puzzle.css';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

export default defineComponent({
  name: 'SudokuPuzzle',
  setup() {
    const undoButton = ref<HTMLButtonElement | null>(null);
    const redoButton = ref<HTMLButtonElement | null>(null);
    const playAgainButton = ref<HTMLButtonElement | null>(null);

    onMounted(resumeSavedGame);

    watch(
      () => sudokuPuzzle.finished,
      async (finished) => {
        if (!finished) return;
        await nextTick();
        playAgainButton.value?.focus();
      },
    );

    const isUndoDisabled = () => sudokuPuzzle.finished || sudokuPuzzle.history.length === 0;
    const isRedoDisabled = () => sudokuPuzzle.finished || sudokuPuzzle.future.length === 0;
    const isHintDisabled = () =>
      sudokuPuzzle.finished ||
      sudokuPuzzle.hintsUsed >= MAX_HINTS ||
      sudokuPuzzle.difficulty === '';

    // A button that disables itself drops focus to the page body, so focus
    // moves to its sibling or back to the grid. After completion the
    // completion panel takes focus instead.
    const focusGrid = () => {
      document.querySelector<HTMLElement>('.grid-cell[tabindex="0"]')?.focus();
    };

    const moveFocusFrom = async (button: HTMLButtonElement | null) => {
      await nextTick();
      if (sudokuPuzzle.finished || !button?.disabled) return;
      const sibling = [undoButton.value, redoButton.value].find(
        (candidate) => candidate && candidate !== button && !candidate.disabled,
      );
      if (sibling) {
        sibling.focus();
      } else {
        focusGrid();
      }
    };

    const handleUndo = async () => {
      undo();
      await moveFocusFrom(undoButton.value);
    };

    const handleRedo = async () => {
      redo();
      await moveFocusFrom(redoButton.value);
    };

    const handleHint = async (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      useHint();
      await moveFocusFrom(button);
    };

    const handlePlayAgain = () => {
      setDifficulty(sudokuPuzzle.difficulty);
      focusGrid();
    };

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
              ref={undoButton}
              class='undo-button'
              onClick={handleUndo}
              disabled={isUndoDisabled()}
            >
              Undo
            </button>
            <button
              ref={redoButton}
              class='redo-button'
              onClick={handleRedo}
              disabled={isRedoDisabled()}
            >
              Redo
            </button>
          </div>

          <button class='hint-button' onClick={handleHint} disabled={isHintDisabled()}>
            Hint ({MAX_HINTS - sudokuPuzzle.hintsUsed})
          </button>
        </div>

        <p class='notice' role='status'>
          {sudokuPuzzle.notice}
        </p>

        <div role='status'>
          {sudokuPuzzle.finished && sudokuPuzzle.result && (
            <section class='completion' aria-labelledby='completion-title'>
              <h2 id='completion-title'>Puzzle solved</h2>
              <p>
                Time {formatTime(sudokuPuzzle.result.time)}. Final score {sudokuPuzzle.result.score}
                , which is {sudokuPuzzle.score} points minus {sudokuPuzzle.result.time} seconds.
                Difficulty {formatDifficulty(sudokuPuzzle.difficulty).toLowerCase()}.
              </p>
              <button ref={playAgainButton} class='play-again-button' onClick={handlePlayAgain}>
                Play again
              </button>
            </section>
          )}
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
