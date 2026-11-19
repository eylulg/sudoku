import { reactive, watch } from 'vue';

import { saveScoreToLeaderboard } from './leaderboard';
import { resetTimer, setHasTimerStarted, startTimer, stopTimer, timer } from './timer';

import { loadSavedGame, saveGame, type SavedGame } from '@/utils/savedGame';

import {
  addCompleteClass,
  createEmptyGrid,
  generateFullGrid,
  getSubgridStartCol,
  getSubgridStartRow,
  removeCellsForDifficulty,
  removeCompleteClass,
} from '@/utils/sudokuPuzzle';

import {
  INITIAL_SCORE,
  CORRECT_CELL_POINTS,
  ERROR_DEDUCTION,
  BASE_HINT_DEDUCTION,
  HINT_DEDUCTION_INCREMENT,
  MAX_HINTS,
  SUDOKU_GRID_SIZE,
  SUDOKU_SUBGRID_SIZE,
} from '@/constants/sudoku';

type ActiveCell = { row: number | null; col: number | null };

interface Snapshot {
  grid: SudokuCell[][];
  score: number;
  hintsUsed: number;
  scoredCells: string[];
}

interface SudokuPuzzle {
  grid: SudokuCell[][];
  solution: SudokuCell[][];
  difficulty: Difficulty;
  score: number;
  hintsUsed: number;
  scoredCells: string[];
  activeCell: ActiveCell;
  history: Snapshot[];
  future: Snapshot[];
  finished: boolean;
  result: { score: number; time: number } | null;
  notice: string;
}

const cellKey = (row: number, col: number) => `${row},${col}`;

export const sudokuPuzzle = reactive<SudokuPuzzle>({
  grid: createEmptyGrid(),
  solution: createEmptyGrid(),
  difficulty: '',
  score: INITIAL_SCORE,
  hintsUsed: 0,
  scoredCells: [],
  activeCell: { row: null, col: null },
  history: [],
  future: [],
  finished: false,
  result: null,
  notice: '',
});

const resetSudokuPuzzle = (difficulty: Difficulty) => {
  sudokuPuzzle.difficulty = difficulty;
  sudokuPuzzle.score = INITIAL_SCORE;
  sudokuPuzzle.hintsUsed = 0;
  sudokuPuzzle.scoredCells = [];
  sudokuPuzzle.activeCell = { row: null, col: null };
  sudokuPuzzle.history = [];
  sudokuPuzzle.future = [];
  sudokuPuzzle.finished = false;
  sudokuPuzzle.result = null;
  sudokuPuzzle.notice = '';
};

const initializeGrid = (difficulty: Difficulty) => {
  const fullGrid = generateFullGrid();
  sudokuPuzzle.solution = fullGrid;
  sudokuPuzzle.grid = removeCellsForDifficulty(fullGrid, difficulty);
};

const initializeTimer = () => {
  resetTimer();
  startTimer();
  setHasTimerStarted(true);
};

export const setDifficulty = (difficulty: Difficulty) => {
  removeCompleteClass();
  resetSudokuPuzzle(difficulty);
  initializeGrid(difficulty);
  initializeTimer();
};

const findHintTarget = (): [number, number] | null => {
  const { row, col } = sudokuPuzzle.activeCell;
  if (row !== null && col !== null && sudokuPuzzle.grid[row][col].value === 0) {
    return [row, col];
  }

  for (let r = 0; r < SUDOKU_GRID_SIZE; r++) {
    for (let c = 0; c < SUDOKU_GRID_SIZE; c++) {
      if (sudokuPuzzle.grid[r][c].value === 0) return [r, c];
    }
  }

  return null;
};

export const useHint = () => {
  if (sudokuPuzzle.finished || sudokuPuzzle.hintsUsed >= MAX_HINTS) return;

  const target = findHintTarget();
  if (!target) return;
  const [row, col] = target;

  pushHistory();

  const deduction = BASE_HINT_DEDUCTION + sudokuPuzzle.hintsUsed * HINT_DEDUCTION_INCREMENT;
  sudokuPuzzle.score -= deduction;
  sudokuPuzzle.hintsUsed++;
  markScored(row, col);

  sudokuPuzzle.grid[row][col] = {
    ...sudokuPuzzle.solution[row][col],
    prefilled: false,
  };
  recalculateErrors(row, col, 0, sudokuPuzzle.grid[row][col].value);
  sudokuPuzzle.notice = `Hint: row ${row + 1}, column ${col + 1} is ${sudokuPuzzle.grid[row][col].value}. Cost ${deduction} points.`;

  checkAndFinishGame();

  sudokuPuzzle.grid[row][col].highlight = true;
  setTimeout(() => {
    sudokuPuzzle.grid[row][col].highlight = false;
  }, 2000);
};

const clearPreviousErrors = (row: number, col: number, oldValue: number | null) => {
  for (let i = 0; i < SUDOKU_GRID_SIZE; i++) {
    if (i !== col && sudokuPuzzle.grid[row][i].value === oldValue) {
      sudokuPuzzle.grid[row][i].error = false;
    }
    if (i !== row && sudokuPuzzle.grid[i][col].value === oldValue) {
      sudokuPuzzle.grid[i][col].error = false;
    }
  }

  const startRow = getSubgridStartRow(row);
  const startCol = getSubgridStartCol(col);

  for (let i = 0; i < SUDOKU_SUBGRID_SIZE; i++) {
    for (let j = 0; j < SUDOKU_SUBGRID_SIZE; j++) {
      const cellRow = startRow + i;
      const cellCol = startCol + j;
      if (
        sudokuPuzzle.grid[cellRow][cellCol].value === oldValue &&
        (cellRow !== row || cellCol !== col)
      ) {
        sudokuPuzzle.grid[cellRow][cellCol].error = false;
      }
    }
  }

  sudokuPuzzle.grid[row][col].error = false;
};

const checkNewValueConflicts = (row: number, col: number, newValue: number | null) => {
  if (newValue === null) return;

  let hasConflict = false;

  for (let i = 0; i < SUDOKU_GRID_SIZE; i++) {
    if (i !== col && sudokuPuzzle.grid[row][i].value === newValue) {
      sudokuPuzzle.grid[row][i].error = true;
      hasConflict = true;
    }
    if (i !== row && sudokuPuzzle.grid[i][col].value === newValue) {
      sudokuPuzzle.grid[i][col].error = true;
      hasConflict = true;
    }
  }

  const startRow = getSubgridStartRow(row);
  const startCol = getSubgridStartCol(col);

  for (let i = 0; i < SUDOKU_SUBGRID_SIZE; i++) {
    for (let j = 0; j < SUDOKU_SUBGRID_SIZE; j++) {
      const cellRow = startRow + i;
      const cellCol = startCol + j;
      if (
        sudokuPuzzle.grid[cellRow][cellCol].value === newValue &&
        (cellRow !== row || cellCol !== col)
      ) {
        sudokuPuzzle.grid[cellRow][cellCol].error = true;
        hasConflict = true;
      }
    }
  }

  sudokuPuzzle.grid[row][col].error = hasConflict;
};

const recalculateErrors = (
  row: number,
  col: number,
  oldValue: number | null,
  newValue: number | null,
) => {
  clearPreviousErrors(row, col, oldValue);
  checkNewValueConflicts(row, col, newValue);
};

const deepCloneGrid = (): SudokuCell[][] => {
  return JSON.parse(JSON.stringify(sudokuPuzzle.grid));
};

const takeSnapshot = (): Snapshot => ({
  grid: deepCloneGrid(),
  score: sudokuPuzzle.score,
  hintsUsed: sudokuPuzzle.hintsUsed,
  scoredCells: [...sudokuPuzzle.scoredCells],
});

const restoreSnapshot = (snapshot: Snapshot) => {
  sudokuPuzzle.grid = snapshot.grid;
  sudokuPuzzle.score = snapshot.score;
  sudokuPuzzle.hintsUsed = snapshot.hintsUsed;
  sudokuPuzzle.scoredCells = snapshot.scoredCells;
  sudokuPuzzle.notice = '';
};

const pushHistory = () => {
  sudokuPuzzle.history.push(takeSnapshot());
  sudokuPuzzle.future = [];
};

const markScored = (row: number, col: number) => {
  const key = cellKey(row, col);
  if (!sudokuPuzzle.scoredCells.includes(key)) {
    sudokuPuzzle.scoredCells.push(key);
  }
};

export const updateCell = (row: number, col: number, newValue: number | null) => {
  if (sudokuPuzzle.finished) return;

  const oldValue = sudokuPuzzle.grid[row][col].value;

  pushHistory();
  sudokuPuzzle.notice = '';

  if (newValue === null) {
    sudokuPuzzle.grid[row][col].value = 0;
    clearPreviousErrors(row, col, oldValue);
    return;
  }

  sudokuPuzzle.grid[row][col].value = newValue;
  recalculateErrors(row, col, oldValue, newValue);

  if (newValue !== oldValue) {
    scoreEntry(row, col, newValue);
  }

  checkAndFinishGame();
};

const scoreEntry = (row: number, col: number, value: number) => {
  if (value === sudokuPuzzle.solution[row][col].value) {
    // A cell pays out once, so clearing and retyping it cannot farm points.
    if (!sudokuPuzzle.scoredCells.includes(cellKey(row, col))) {
      sudokuPuzzle.score += CORRECT_CELL_POINTS;
      markScored(row, col);
    }
    return;
  }

  sudokuPuzzle.score -= ERROR_DEDUCTION;
  if (!sudokuPuzzle.grid[row][col].error) {
    sudokuPuzzle.notice = `Digit ${value} is not correct here. Minus ${ERROR_DEDUCTION} point.`;
  }
};

export const setActiveCell = (row: number | null, col: number | null) => {
  sudokuPuzzle.activeCell = { row, col };
};

export const undo = () => {
  if (sudokuPuzzle.finished) return;
  const previous = sudokuPuzzle.history.pop();
  if (!previous) return;
  sudokuPuzzle.future.push(takeSnapshot());
  restoreSnapshot(previous);
};

export const redo = () => {
  if (sudokuPuzzle.finished) return;
  const next = sudokuPuzzle.future.pop();
  if (!next) return;
  sudokuPuzzle.history.push(takeSnapshot());
  restoreSnapshot(next);
};

const isGridComplete = () => {
  return sudokuPuzzle.grid.every((row, rowIndex) =>
    row.every((cell, colIndex) => cell.value === sudokuPuzzle.solution[rowIndex][colIndex].value),
  );
};

const finalizeTimer = () => {
  stopTimer();
  setHasTimerStarted(false);
};

const calculateFinalScore = () => {
  return sudokuPuzzle.score - timer.time;
};

const checkAndFinishGame = () => {
  if (sudokuPuzzle.finished || !isGridComplete()) return;

  sudokuPuzzle.finished = true;
  finalizeTimer();
  const finalScore = calculateFinalScore();
  sudokuPuzzle.result = { score: finalScore, time: timer.time };
  sudokuPuzzle.notice = '';
  saveScoreToLeaderboard(finalScore, sudokuPuzzle.difficulty);
  addCompleteClass();
};

const toSavedGame = (): SavedGame => ({
  grid: sudokuPuzzle.grid.map((row) => row.map((cell) => ({ ...cell, highlight: false }))),
  solution: sudokuPuzzle.solution,
  difficulty: sudokuPuzzle.difficulty,
  score: sudokuPuzzle.score,
  hintsUsed: sudokuPuzzle.hintsUsed,
  scoredCells: sudokuPuzzle.scoredCells,
  finished: sudokuPuzzle.finished,
  result: sudokuPuzzle.result,
  time: timer.time,
});

const persistGame = () => {
  if (sudokuPuzzle.difficulty === '') return;
  saveGame(toSavedGame());
};

watch(sudokuPuzzle, persistGame, { deep: true });
watch(() => timer.time, persistGame);

export const resumeSavedGame = () => {
  const saved = loadSavedGame();
  if (!saved) return;

  Object.assign(sudokuPuzzle, {
    grid: saved.grid,
    solution: saved.solution,
    difficulty: saved.difficulty,
    score: saved.score,
    hintsUsed: saved.hintsUsed,
    scoredCells: saved.scoredCells,
    activeCell: { row: null, col: null },
    history: [],
    future: [],
    finished: saved.finished,
    result: saved.result,
    notice: '',
  });
  timer.time = saved.time;

  if (!saved.finished) {
    startTimer();
    setHasTimerStarted(true);
  }
};
