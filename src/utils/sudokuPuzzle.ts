import { SUDOKU_GRID_SIZE, SUDOKU_SUBGRID_SIZE } from '@/constants/sudoku';

export const createEmptyGrid = (): SudokuCell[][] => {
  return Array(9)
    .fill(null)
    .map(() =>
      Array(9)
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

export const removeCellsForDifficulty = (
  grid: SudokuCell[][],
  difficulty: Difficulty,
): SudokuCell[][] => {
  const result = grid.map((row) => row.map((cell) => ({ ...cell })));

  const visibleCellCounts = {
    beginner: { min: 36, max: 40 },
    intermediate: { min: 32, max: 36 },
    hard: { min: 28, max: 32 },
    expert: { min: 24, max: 28 },
  };

  const totalCells = 81;
  const visibleRange =
    difficulty !== ''
      ? visibleCellCounts[difficulty]
      : visibleCellCounts.beginner;
  const targetVisibleCount = Math.floor(
    Math.random() * (visibleRange.max - visibleRange.min + 1) +
      visibleRange.min,
  );

  const cellsToRemove = totalCells - targetVisibleCount;

  for (let removed = 0; removed < cellsToRemove; removed++) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (result[row][col].value !== 0) {
      result[row][col].value = 0;
      result[row][col].prefilled = false;
    }
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
