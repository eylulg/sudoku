export const SUDOKU_GRID_SIZE = 9;
export const SUDOKU_SUBGRID_SIZE = Math.sqrt(SUDOKU_GRID_SIZE);

export const DIFFICULTIES: readonly Difficulty[] = [
  'beginner',
  'intermediate',
  'hard',
  'expert',
];

export const INITIAL_SCORE = 500;
export const CORRECT_CELL_POINTS = 5;
export const ERROR_DEDUCTION = 1;
export const MAX_HINTS = 10;
export const BASE_HINT_DEDUCTION = 3;
export const HINT_DEDUCTION_INCREMENT = 1;
