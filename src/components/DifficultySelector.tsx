import { defineComponent, ref } from 'vue';

import { setDifficulty, sudokuPuzzle } from '@/stores/sudokuPuzzle';

import { DIFFICULTIES, INITIAL_SCORE } from '@/constants/sudoku';
import { formatDifficulty } from '@/utils/sudokuPuzzle';

import '@/styles/difficulty-selector.css';

export default defineComponent({
  name: 'DifficultySelector',
  setup() {
    const pending = ref<Difficulty>('');
    const dialog = ref<HTMLDialogElement | null>(null);

    const hasProgress = () =>
      !sudokuPuzzle.finished &&
      sudokuPuzzle.difficulty !== '' &&
      (sudokuPuzzle.history.length > 0 ||
        sudokuPuzzle.hintsUsed > 0 ||
        sudokuPuzzle.score !== INITIAL_SCORE);

    const handleDifficultyChange = (event: Event) => {
      const target = event.target as HTMLSelectElement;
      const difficulty = target.value as Difficulty;

      if (!hasProgress()) {
        setDifficulty(difficulty);
        return;
      }

      pending.value = difficulty;
      target.value = sudokuPuzzle.difficulty;
      dialog.value?.showModal();
    };

    const closeDialog = () => {
      pending.value = '';
      dialog.value?.close();
    };

    const confirmChange = () => {
      setDifficulty(pending.value);
      closeDialog();
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
            Choose a difficulty
          </option>
          {DIFFICULTIES.map((level) => (
            <option key={level} value={level}>
              {formatDifficulty(level)}
            </option>
          ))}
        </select>

        <dialog
          ref={dialog}
          class='confirm-dialog'
          aria-labelledby='confirm-title'
          onClose={closeDialog}
        >
          <h2 id='confirm-title'>Start a new game?</h2>
          <p>
            Your current game and score will be lost. The new game is{' '}
            {formatDifficulty(pending.value).toLowerCase()}.
          </p>
          <div class='confirm-actions'>
            <button class='confirm-cancel' onClick={closeDialog}>
              Keep playing
            </button>
            <button class='confirm-accept' onClick={confirmChange}>
              Start new game
            </button>
          </div>
        </dialog>
      </div>
    );
  },
});
