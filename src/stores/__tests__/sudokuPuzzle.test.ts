import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { leaderboard } from '@/stores/leaderboard';
import {
  redo,
  setDifficulty,
  sudokuPuzzle,
  undo,
  updateCell,
  useHint,
} from '@/stores/sudokuPuzzle';
import { clearTimer, timer } from '@/stores/timer';
import { initializeLeaderboard } from '@/utils/leaderboard';
import { generateFullGrid } from '@/utils/sudokuPuzzle';
import {
  BASE_HINT_DEDUCTION,
  CORRECT_CELL_POINTS,
  ERROR_DEDUCTION,
  HINT_DEDUCTION_INCREMENT,
  INITIAL_SCORE,
} from '@/constants/sudoku';

const clone = (grid: SudokuCell[][]) => grid.map((row) => row.map((cell) => ({ ...cell })));

/** Loads a solved grid with the given cells cleared, bypassing the generator. */
const loadPuzzle = (emptyCells: Array<[number, number]>) => {
  const solution = generateFullGrid();
  const grid = clone(solution);
  for (const [row, col] of emptyCells) {
    grid[row][col] = { ...grid[row][col], value: 0, prefilled: false };
  }
  Object.assign(sudokuPuzzle, {
    solution,
    grid,
    difficulty: 'beginner',
    score: INITIAL_SCORE,
    hintsUsed: 0,
    scoredCells: [],
    finished: false,
    result: null,
    notice: '',
    activeCell: { row: null, col: null },
    history: [],
    future: [],
  });
  return solution;
};

/** A digit that is wrong for the cell and already used elsewhere in its row. */
const wrongDigit = (solution: SudokuCell[][], row: number, col: number) =>
  solution[row][(col + 1) % 9].value;

describe('sudoku puzzle store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    leaderboard.value = initializeLeaderboard();
    localStorage.clear();
    timer.time = 0;
  });

  afterEach(() => {
    clearTimer();
    timer.isRunning = false;
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('scoring entries', () => {
    it('adds points for a correct entry', () => {
      const solution = loadPuzzle([
        [0, 0],
        [4, 4],
      ]);
      updateCell(0, 0, solution[0][0].value);
      expect(sudokuPuzzle.score).toBe(INITIAL_SCORE + CORRECT_CELL_POINTS);
      expect(sudokuPuzzle.grid[0][0].error).toBe(false);
    });

    it('does not score the same value twice', () => {
      const solution = loadPuzzle([
        [0, 0],
        [4, 4],
      ]);
      updateCell(0, 0, solution[0][0].value);
      updateCell(0, 0, solution[0][0].value);
      expect(sudokuPuzzle.score).toBe(INITIAL_SCORE + CORRECT_CELL_POINTS);
    });

    it('scores a cell once when it is cleared and retyped', () => {
      const solution = loadPuzzle([
        [0, 0],
        [4, 4],
      ]);
      updateCell(0, 0, solution[0][0].value);
      updateCell(0, 0, null);
      updateCell(0, 0, solution[0][0].value);
      expect(sudokuPuzzle.score).toBe(INITIAL_SCORE + CORRECT_CELL_POINTS);
    });

    it('deducts points for a wrong entry and marks the conflict', () => {
      const solution = loadPuzzle([
        [0, 0],
        [4, 4],
      ]);
      const digit = wrongDigit(solution, 0, 0);
      updateCell(0, 0, digit);

      expect(sudokuPuzzle.score).toBe(INITIAL_SCORE - ERROR_DEDUCTION);
      expect(sudokuPuzzle.grid[0][0].error).toBe(true);
      expect(sudokuPuzzle.grid[0][1].error).toBe(true);
    });

    it('deducts for each different wrong value', () => {
      const solution = loadPuzzle([
        [0, 0],
        [4, 4],
      ]);
      updateCell(0, 0, wrongDigit(solution, 0, 0));
      updateCell(0, 0, solution[0][2].value);
      expect(sudokuPuzzle.score).toBe(INITIAL_SCORE - 2 * ERROR_DEDUCTION);
    });

    it('clears errors without changing the score when a cell is emptied', () => {
      const solution = loadPuzzle([
        [0, 0],
        [4, 4],
      ]);
      updateCell(0, 0, wrongDigit(solution, 0, 0));
      updateCell(0, 0, null);

      expect(sudokuPuzzle.grid[0][0].value).toBe(0);
      expect(sudokuPuzzle.grid[0][0].error).toBe(false);
      expect(sudokuPuzzle.grid[0][1].error).toBe(false);
      expect(sudokuPuzzle.score).toBe(INITIAL_SCORE - ERROR_DEDUCTION);
    });
  });

  describe('hints', () => {
    it('deducts more for each hint and fills the next empty cell', () => {
      const solution = loadPuzzle([
        [0, 3],
        [2, 5],
        [7, 1],
        [8, 8],
      ]);

      useHint();
      useHint();
      useHint();

      const expectedDeduction = 3 * BASE_HINT_DEDUCTION + (0 + 1 + 2) * HINT_DEDUCTION_INCREMENT;
      expect(sudokuPuzzle.score).toBe(INITIAL_SCORE - expectedDeduction);
      expect(sudokuPuzzle.hintsUsed).toBe(3);
      expect(sudokuPuzzle.grid[0][3].value).toBe(solution[0][3].value);
      expect(sudokuPuzzle.grid[2][5].value).toBe(solution[2][5].value);
      expect(sudokuPuzzle.grid[7][1].value).toBe(solution[7][1].value);
      expect(sudokuPuzzle.grid[8][8].value).toBe(0);
    });

    it('highlights the hinted cell for two seconds', () => {
      loadPuzzle([
        [1, 1],
        [5, 5],
      ]);
      useHint();
      expect(sudokuPuzzle.grid[1][1].highlight).toBe(true);
      vi.advanceTimersByTime(2000);
      expect(sudokuPuzzle.grid[1][1].highlight).toBe(false);
    });
  });

  describe('undo and redo', () => {
    it('restores the previous grid and reapplies it', () => {
      const solution = loadPuzzle([
        [0, 0],
        [4, 4],
      ]);
      updateCell(0, 0, solution[0][0].value);
      undo();
      expect(sudokuPuzzle.grid[0][0].value).toBe(0);
      redo();
      expect(sudokuPuzzle.grid[0][0].value).toBe(solution[0][0].value);
    });
  });

  describe('finishing a game', () => {
    it('saves the score minus the elapsed seconds to the leaderboard', () => {
      const solution = loadPuzzle([[3, 3]]);
      timer.time = 42;
      // The last cell is filled through a hint, which also checks for completion.
      useHint();

      const expected = INITIAL_SCORE - BASE_HINT_DEDUCTION - 42;
      expect(sudokuPuzzle.grid[3][3].value).toBe(solution[3][3].value);
      expect(leaderboard.value.beginner).toEqual([{ score: expected }]);
      expect(sudokuPuzzle.finished).toBe(true);
    });

    it('locks the board and writes the leaderboard once after completion', () => {
      const solution = loadPuzzle([[3, 3]]);
      updateCell(3, 3, solution[3][3].value);
      const scoreAtFinish = sudokuPuzzle.score;

      updateCell(3, 3, null);
      updateCell(3, 3, solution[3][3].value);

      expect(sudokuPuzzle.grid[3][3].value).toBe(solution[3][3].value);
      expect(sudokuPuzzle.score).toBe(scoreAtFinish);
      expect(leaderboard.value.beginner).toHaveLength(1);
    });

    it('keeps the three best scores per difficulty', () => {
      for (const time of [100, 10, 50, 0]) {
        loadPuzzle([[0, 0]]);
        timer.time = time;
        useHint();
      }
      const base = INITIAL_SCORE - BASE_HINT_DEDUCTION;
      expect(leaderboard.value.beginner).toEqual([
        { score: base },
        { score: base - 10 },
        { score: base - 50 },
      ]);
    });
  });

  describe('setDifficulty', () => {
    it('starts a fresh puzzle with a running timer', () => {
      setDifficulty('expert');
      expect(sudokuPuzzle.difficulty).toBe('expert');
      expect(sudokuPuzzle.score).toBe(INITIAL_SCORE);
      expect(sudokuPuzzle.hintsUsed).toBe(0);
      expect(timer.isRunning).toBe(true);
      const visible = sudokuPuzzle.grid.flat().filter((cell) => cell.value !== 0).length;
      expect(visible).toBeGreaterThanOrEqual(24);
    });
  });
});
