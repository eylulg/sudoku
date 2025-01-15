import { reactive } from 'vue';

import { saveScoreToLeaderboard } from './leaderboard';
import {
  resetTimer,
  setHasTimerStarted,
  startTimer,
  stopTimer,
  timer,
} from './timer';

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
  SUDOKU_GRID_SIZE,
  SUDOKU_SUBGRID_SIZE,
} from '@/constants/sudoku';

type ActiveCell = { row: number | null; col: number | null };

interface SudokuPuzzle {
  grid: SudokuCell[][];
  solution: SudokuCell[][];
  difficulty: Difficulty;
  score: number;
  hintsUsed: number;
  activeCell: ActiveCell;
  history: SudokuCell[][][];
  future: SudokuCell[][][];
}

export const sudokuPuzzle = reactive<SudokuPuzzle>({
  grid: createEmptyGrid(),
  solution: createEmptyGrid(),
  difficulty: '',
  score: INITIAL_SCORE,
  hintsUsed: 0,
  activeCell: { row: null, col: null },
  history: [],
  future: [],
});

const resetSudokuPuzzle = (difficulty: Difficulty) => {
  sudokuPuzzle.difficulty = difficulty;
  sudokuPuzzle.score = INITIAL_SCORE;
  sudokuPuzzle.hintsUsed = 0;
  sudokuPuzzle.activeCell = { row: null, col: null };
  sudokuPuzzle.history = [];
  sudokuPuzzle.future = [];
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

export const useHint = () => {
  const deduction =
    BASE_HINT_DEDUCTION + sudokuPuzzle.hintsUsed * HINT_DEDUCTION_INCREMENT;
  sudokuPuzzle.score -= deduction;
  sudokuPuzzle.hintsUsed++;

  for (let row = 0; row < SUDOKU_GRID_SIZE; row++) {
    for (let col = 0; col < SUDOKU_GRID_SIZE; col++) {
      if (sudokuPuzzle.grid[row][col].value === 0) {
        sudokuPuzzle.grid[row][col] = {
          ...sudokuPuzzle.solution[row][col],
          prefilled: false,
        };

        checkAndFinishGame();

        sudokuPuzzle.grid[row][col].highlight = true;
        setTimeout(() => {
          sudokuPuzzle.grid[row][col].highlight = false;
        }, 2000);

        return;
      }
    }
  }
};

const clearPreviousErrors = (
  row: number,
  col: number,
  oldValue: number | null,
) => {
  for (let i = 0; i < SUDOKU_GRID_SIZE; i++) {
    if (i !== col && sudokuPuzzle.grid[row][i].value === oldValue) {
      sudokuPuzzle.grid[row][i].error = false;
    }
    if ((i !== row && sudokuPuzzle.grid[i][col].value) === oldValue) {
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

const checkNewValueConflicts = (
  row: number,
  col: number,
  newValue: number | null,
) => {
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

const deepCloneGrid = () => {
  return JSON.parse(JSON.stringify(sudokuPuzzle.grid));
};

export const updateCell = (
  row: number,
  col: number,
  newValue: number | null,
) => {
  const oldValue = sudokuPuzzle.grid[row][col].value;

  sudokuPuzzle.history.push(deepCloneGrid());
  sudokuPuzzle.future = [];

  if (newValue === null) {
    sudokuPuzzle.grid[row][col].value = 0;
    clearPreviousErrors(row, col, oldValue);
    return;
  }

  sudokuPuzzle.grid[row][col].value = newValue;
  recalculateErrors(row, col, oldValue, newValue);

  const correctValue = sudokuPuzzle.solution[row][col].value;

  if (newValue === correctValue) {
    sudokuPuzzle.score += CORRECT_CELL_POINTS;
  } else if (newValue !== oldValue) {
    sudokuPuzzle.score -= ERROR_DEDUCTION;
  }
};

export const setActiveCell = (row: number | null, col: number | null) => {
  sudokuPuzzle.activeCell = { row, col };
};

export const undo = () => {
  if (sudokuPuzzle.history.length > 0) {
    const lastState = sudokuPuzzle.history.pop();
    sudokuPuzzle.future.push(deepCloneGrid());
    if (lastState) {
      sudokuPuzzle.grid = lastState;
    }
  }
};

export const redo = () => {
  if (sudokuPuzzle.future.length > 0) {
    const lastFutureState = sudokuPuzzle.future.pop();
    sudokuPuzzle.history.push(deepCloneGrid());
    if (lastFutureState) {
      sudokuPuzzle.grid = lastFutureState;
    }
  }
};

const isGridComplete = () => {
  return sudokuPuzzle.grid.every((row, rowIndex) =>
    row.every(
      (cell, colIndex) =>
        cell.value === sudokuPuzzle.solution[rowIndex][colIndex].value,
    ),
  );
};

const finalizeTimer = () => {
  stopTimer();
  setHasTimerStarted(false);
};

const calculateFinalScore = () => {
  return sudokuPuzzle.score - timer.time;
};

const showCompletionMessage = () => {
  addCompleteClass();
  setTimeout(() => {
    alert('Congratulations! You solved the Sudoku puzzle!');
  }, 500);
};

export const checkAndFinishGame = () => {
  if (isGridComplete()) {
    finalizeTimer();
    const finalScore = calculateFinalScore();
    saveScoreToLeaderboard(finalScore, sudokuPuzzle.difficulty);
    showCompletionMessage();
  }
};
