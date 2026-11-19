import { describe, expect, it } from 'vitest';

import {
  VISIBLE_CELL_COUNTS,
  countSolutions,
  createEmptyGrid,
  generateFullGrid,
  getSubgridStartCol,
  getSubgridStartRow,
  hasUniqueSolution,
  removeCellsForDifficulty,
} from '@/utils/sudokuPuzzle';
import { DIFFICULTIES } from '@/constants/sudoku';

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const sorted = (values: number[]) => [...values].sort((a, b) => a - b);

const rowsOf = (grid: SudokuCell[][]) =>
  grid.map((row) => row.map((cell) => cell.value));
const colsOf = (grid: SudokuCell[][]) =>
  DIGITS.map((_, col) => grid.map((row) => row[col].value));
const boxesOf = (grid: SudokuCell[][]) =>
  DIGITS.map((_, box) => {
    const startRow = Math.floor(box / 3) * 3;
    const startCol = (box % 3) * 3;
    return [0, 1, 2].flatMap((r) =>
      [0, 1, 2].map((c) => grid[startRow + r][startCol + c].value),
    );
  });

const visibleCount = (grid: SudokuCell[][]) =>
  grid.flat().filter((cell) => cell.value !== 0).length;

describe('createEmptyGrid', () => {
  it('creates a 9 by 9 grid of empty cells', () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(9);
    grid.forEach((row) => expect(row).toHaveLength(9));
    expect(grid.flat().every((cell) => cell.value === 0)).toBe(true);
  });
});

describe('generateFullGrid', () => {
  it.each(Array.from({ length: 10 }, (_, i) => i))(
    'produces a valid complete grid (run %i)',
    () => {
      const grid = generateFullGrid();
      for (const group of [
        ...rowsOf(grid),
        ...colsOf(grid),
        ...boxesOf(grid),
      ]) {
        expect(sorted(group)).toEqual(DIGITS);
      }
    },
  );

  it('produces different grids', () => {
    const first = JSON.stringify(rowsOf(generateFullGrid()));
    const others = Array.from({ length: 5 }, () =>
      JSON.stringify(rowsOf(generateFullGrid())),
    );
    expect(others.some((grid) => grid !== first)).toBe(true);
  });
});

describe('subgrid helpers', () => {
  it('returns the top left corner of the 3 by 3 box', () => {
    expect([0, 1, 2, 3, 5, 6, 8].map(getSubgridStartRow)).toEqual([
      0, 0, 0, 3, 3, 6, 6,
    ]);
    expect(getSubgridStartCol(4)).toBe(3);
  });
});

describe('countSolutions', () => {
  it('finds exactly one solution for a full valid grid', () => {
    expect(countSolutions(rowsOf(generateFullGrid()))).toBe(1);
  });

  it('stops counting at the limit for an empty grid', () => {
    const empty = rowsOf(createEmptyGrid());
    expect(countSolutions(empty, 2)).toBe(2);
    expect(countSolutions(empty, 5)).toBe(5);
  });

  it('returns 0 when the givens already conflict', () => {
    const values = rowsOf(createEmptyGrid());
    values[0][0] = 5;
    values[0][8] = 5;
    expect(countSolutions(values)).toBe(0);
  });

  it('detects a puzzle with more than one solution', () => {
    const values = rowsOf(generateFullGrid());
    // Swapping two rows of the same band keeps a grid valid, so with both rows
    // cleared the original and the swapped grid are both solutions.
    values[0] = Array(9).fill(0);
    values[1] = Array(9).fill(0);
    expect(countSolutions(values)).toBe(2);
  });
});

describe('removeCellsForDifficulty', () => {
  it.each(DIFFICULTIES)(
    'keeps a single solution for %s puzzles',
    (difficulty) => {
      const solution = generateFullGrid();
      const puzzle = removeCellsForDifficulty(solution, difficulty);

      expect(hasUniqueSolution(puzzle)).toBe(true);

      // Every visible cell matches the solution and is marked as given.
      const cells = puzzle.flatMap((row, r) =>
        row.map((cell, c) => ({ cell, expected: solution[r][c].value })),
      );
      const visible = cells.filter(({ cell }) => cell.value !== 0);
      const hidden = cells.filter(({ cell }) => cell.value === 0);
      expect(
        visible.every(({ cell, expected }) => cell.value === expected),
      ).toBe(true);
      expect(visible.every(({ cell }) => cell.prefilled)).toBe(true);
      expect(hidden.every(({ cell }) => !cell.prefilled)).toBe(true);
    },
  );

  it.each(DIFFICULTIES)(
    'shows about the right number of cells for %s puzzles',
    (difficulty) => {
      const range = VISIBLE_CELL_COUNTS[difficulty as Exclude<Difficulty, ''>];
      for (let i = 0; i < 5; i++) {
        const count = visibleCount(
          removeCellsForDifficulty(generateFullGrid(), difficulty),
        );
        expect(count).toBeGreaterThanOrEqual(range.min);
        // Uniqueness can stop removal a few cells early on the hardest levels.
        expect(count).toBeLessThanOrEqual(range.max + 4);
      }
    },
  );

  it('does not change the solved grid it is given', () => {
    const solution = generateFullGrid();
    const before = JSON.stringify(solution);
    removeCellsForDifficulty(solution, 'hard');
    expect(JSON.stringify(solution)).toBe(before);
  });

  it('falls back to beginner counts when no difficulty is set', () => {
    const count = visibleCount(
      removeCellsForDifficulty(generateFullGrid(), ''),
    );
    expect(count).toBeGreaterThanOrEqual(VISIBLE_CELL_COUNTS.beginner.min);
    expect(count).toBeLessThanOrEqual(VISIBLE_CELL_COUNTS.beginner.max);
  });
});
