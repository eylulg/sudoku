import { DIFFICULTIES, SUDOKU_GRID_SIZE } from '@/constants/sudoku';

export interface SavedGame {
  grid: SudokuCell[][];
  solution: SudokuCell[][];
  difficulty: Difficulty;
  score: number;
  hintsUsed: number;
  scoredCells: string[];
  finished: boolean;
  result: { score: number; time: number } | null;
  time: number;
}

export const SAVED_GAME_STORAGE_KEY = 'sudoku-game';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isCell = (value: unknown): value is SudokuCell =>
  isRecord(value) &&
  Number.isInteger(value.value) &&
  (value.value as number) >= 0 &&
  (value.value as number) <= SUDOKU_GRID_SIZE &&
  typeof value.prefilled === 'boolean' &&
  typeof value.error === 'boolean' &&
  typeof value.highlight === 'boolean';

const isGrid = (value: unknown): value is SudokuCell[][] =>
  Array.isArray(value) &&
  value.length === SUDOKU_GRID_SIZE &&
  value.every(
    (row) =>
      Array.isArray(row) &&
      row.length === SUDOKU_GRID_SIZE &&
      row.every(isCell),
  );

const isCount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isResult = (value: unknown): value is SavedGame['result'] =>
  value === null ||
  (isRecord(value) && isCount(value.score) && isCount(value.time));

const isSavedGame = (value: unknown): value is SavedGame =>
  isRecord(value) &&
  isGrid(value.grid) &&
  isGrid(value.solution) &&
  DIFFICULTIES.includes(value.difficulty as Difficulty) &&
  isCount(value.score) &&
  isCount(value.hintsUsed) &&
  Array.isArray(value.scoredCells) &&
  value.scoredCells.every((key) => typeof key === 'string') &&
  typeof value.finished === 'boolean' &&
  isResult(value.result) &&
  isCount(value.time);

/** Missing, unreadable or malformed data means there is no game to resume. */
export const loadSavedGame = (): SavedGame | null => {
  try {
    const stored = localStorage.getItem(SAVED_GAME_STORAGE_KEY);
    if (!stored) return null;

    const parsed: unknown = JSON.parse(stored);
    return isSavedGame(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const saveGame = (game: SavedGame) => {
  try {
    localStorage.setItem(SAVED_GAME_STORAGE_KEY, JSON.stringify(game));
  } catch {
    // Storage can be full or blocked; the game still works without resume.
  }
};
