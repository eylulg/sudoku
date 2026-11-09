import { SUDOKU_GRID_SIZE, SUDOKU_SUBGRID_SIZE } from '@/constants/sudoku';

export const createEmptyGrid = (): SudokuCell[][] => {
  return Array(SUDOKU_GRID_SIZE)
    .fill(null)
    .map(() =>
      Array(SUDOKU_GRID_SIZE)
        .fill(null)
        .map(() => ({
          value: 0,
          prefilled: true,
          error: false,
          highlight: false,
        })),
    );
};

const isGridValid = (
  grid: SudokuCell[][],
  row: number,
  col: number,
  num: number,
) => {
  for (let i = 0; i < SUDOKU_GRID_SIZE; i++) {
    if (grid[row][i].value === num || grid[i][col].value === num) {
      return false;
    }
  }

  const startRow = getSubgridStartRow(row);
  const startCol = getSubgridStartCol(col);
  for (let i = 0; i < SUDOKU_SUBGRID_SIZE; i++) {
    for (let j = 0; j < SUDOKU_SUBGRID_SIZE; j++) {
      if (grid[startRow + i][startCol + j].value === num) {
        return false;
      }
    }
  }

  return true;
};

const shuffleArray = (array: number[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
};

const fillGrid = (grid: SudokuCell[][]) => {
  const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  for (let row = 0; row < SUDOKU_GRID_SIZE; row++) {
    for (let col = 0; col < SUDOKU_GRID_SIZE; col++) {
      if (grid[row][col].value === 0) {
        for (const num of numbers) {
          if (isGridValid(grid, row, col, num)) {
            grid[row][col].value = num;

            if (fillGrid(grid)) {
              return true;
            }

            grid[row][col].value = 0;
          }
        }

        return false;
      }
    }
  }

  return true;
};

export const generateFullGrid = () => {
  const grid = createEmptyGrid();
  fillGrid(grid);
  return grid;
};

export const VISIBLE_CELL_COUNTS: Record<
  Exclude<Difficulty, ''>,
  { min: number; max: number }
> = {
  beginner: { min: 36, max: 40 },
  intermediate: { min: 32, max: 36 },
  hard: { min: 28, max: 32 },
  expert: { min: 24, max: 28 },
};

const toValues = (grid: SudokuCell[][]) =>
  grid.map((row) => row.map((cell) => cell.value));

/**
 * Counts the solutions of a puzzle, stopping once `limit` is reached.
 * Empty cells are 0. Uses backtracking that always fills the empty cell
 * with the fewest candidates first, with bit masks for rows, columns and boxes.
 */
export const countSolutions = (values: number[][], limit = 2): number => {
  const size = SUDOKU_GRID_SIZE;
  const rows = new Array<number>(size).fill(0);
  const cols = new Array<number>(size).fill(0);
  const boxes = new Array<number>(size).fill(0);
  const empty: Array<[number, number]> = [];
  const boxOf = (row: number, col: number) =>
    getSubgridStartRow(row) + Math.floor(col / SUDOKU_SUBGRID_SIZE);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const value = values[row][col];
      if (value === 0) {
        empty.push([row, col]);
        continue;
      }
      const bit = 1 << value;
      const box = boxOf(row, col);
      if (rows[row] & bit || cols[col] & bit || boxes[box] & bit) return 0;
      rows[row] |= bit;
      cols[col] |= bit;
      boxes[box] |= bit;
    }
  }

  const ALL = 0b1111111110;
  let count = 0;

  const search = (remaining: number): void => {
    if (remaining === 0) {
      count++;
      return;
    }

    let bestIndex = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let i = 0; i < remaining; i++) {
      const [row, col] = empty[i];
      const mask = ALL & ~(rows[row] | cols[col] | boxes[boxOf(row, col)]);
      let options = 0;
      for (let m = mask; m; m &= m - 1) options++;
      if (options < bestCount) {
        bestIndex = i;
        bestMask = mask;
        bestCount = options;
        if (options <= 1) break;
      }
    }
    if (bestCount === 0) return;

    const [row, col] = empty[bestIndex];
    const box = boxOf(row, col);
    empty[bestIndex] = empty[remaining - 1];
    empty[remaining - 1] = [row, col];

    for (let value = 1; value <= size && count < limit; value++) {
      const bit = 1 << value;
      if (!(bestMask & bit)) continue;
      rows[row] |= bit;
      cols[col] |= bit;
      boxes[box] |= bit;
      search(remaining - 1);
      rows[row] &= ~bit;
      cols[col] &= ~bit;
      boxes[box] &= ~bit;
    }

    empty[remaining - 1] = empty[bestIndex];
    empty[bestIndex] = [row, col];
  };

  search(empty.length);
  return count;
};

export const hasUniqueSolution = (grid: SudokuCell[][]) =>
  countSolutions(toValues(grid), 2) === 1;

/**
 * Hides cells of a solved grid until the number of visible cells for the
 * difficulty is reached. A cell is only hidden when the puzzle still has
 * exactly one solution, so the stored solution is the only correct answer.
 * If no more cells can be hidden without losing uniqueness, the puzzle keeps
 * a few more visible cells than the target.
 */
export const removeCellsForDifficulty = (
  grid: SudokuCell[][],
  difficulty: Difficulty,
): SudokuCell[][] => {
  const result = grid.map((row) => row.map((cell) => ({ ...cell })));
  const values = toValues(result);

  const visibleRange =
    difficulty !== ''
      ? VISIBLE_CELL_COUNTS[difficulty]
      : VISIBLE_CELL_COUNTS.beginner;
  const targetVisibleCount = Math.floor(
    Math.random() * (visibleRange.max - visibleRange.min + 1) +
      visibleRange.min,
  );

  const totalCells = SUDOKU_GRID_SIZE * SUDOKU_GRID_SIZE;
  const positions = shuffleArray(
    Array.from({ length: totalCells }, (_, index) => index),
  );
  let visibleCount = totalCells;

  for (const position of positions) {
    if (visibleCount <= targetVisibleCount) break;

    const row = Math.floor(position / SUDOKU_GRID_SIZE);
    const col = position % SUDOKU_GRID_SIZE;
    const value = values[row][col];

    values[row][col] = 0;
    if (countSolutions(values, 2) !== 1) {
      values[row][col] = value;
      continue;
    }

    result[row][col].value = 0;
    result[row][col].prefilled = false;
    visibleCount--;
  }

  return result;
};

export const getSubgridStartRow = (row: number): number => {
  return Math.floor(row / SUDOKU_SUBGRID_SIZE) * SUDOKU_SUBGRID_SIZE;
};

export const getSubgridStartCol = (col: number): number => {
  return Math.floor(col / SUDOKU_SUBGRID_SIZE) * SUDOKU_SUBGRID_SIZE;
};

export const addCompleteClass = () => {
  const gridElements = document.querySelectorAll('.grid-row .grid-cell');
  if (gridElements) {
    gridElements.forEach((element) => {
      element.classList.add('complete');
    });
  }
};

export const removeCompleteClass = () => {
  const gridElements = document.querySelectorAll('.grid-row .grid-cell');
  if (gridElements) {
    gridElements.forEach((element) => {
      element.classList.remove('complete');
    });
  }
};
