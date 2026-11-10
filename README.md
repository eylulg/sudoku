# Sudoku

A Sudoku game built with Vue 3 and TypeScript. Pick a difficulty, fill the grid, and try to beat your best score on the local leaderboard.

**Live demo:** https://eylulg.github.io/sudoku/

## Features

- Four difficulty levels: beginner, intermediate, hard and expert.
- Every puzzle has exactly one solution.
- Score that rewards correct entries and penalises mistakes, hints and time.
- Conflicting digits are highlighted in the row, column and 3 by 3 box.
- Undo and redo, up to 10 hints, and a digit pad that greys out digits already used nine times.
- Timer that pauses when the tab is hidden or the window loses focus.
- Top three scores per difficulty, saved in localStorage.
- Keyboard play: one tab stop for the grid, arrow keys to move between cells, digits 1 to 9 to fill a cell. Cells are labelled with their row, column and state for screen readers.

## How the generator and solver work

The code lives in [`src/utils/sudokuPuzzle.ts`](src/utils/sudokuPuzzle.ts).

**Full grid.** `generateFullGrid` fills an empty 9 by 9 grid cell by cell with backtracking. The digits 1 to 9 are shuffled once per grid, and each digit is tried in that order; a digit is placed if it is not already in the cell's row, column or box. If no digit fits, the algorithm steps back and tries the next digit in the previous cell. The shuffle is what makes every grid different.

**Solver.** `countSolutions` counts how many ways a partly filled grid can be completed and stops as soon as it reaches a limit (2 by default, which is enough to tell "unique" from "not unique"). It keeps one bit mask per row, column and box for the digits already used, so the candidates for a cell are a single bitwise operation. At each step it fills the empty cell with the fewest candidates first, which keeps the search small: a typical check takes well under a millisecond.

**Removing cells.** `removeCellsForDifficulty` picks a target number of visible cells for the difficulty:

| Difficulty   | Visible cells |
| ------------ | ------------- |
| Beginner     | 36 to 40      |
| Intermediate | 32 to 36      |
| Hard         | 28 to 32      |
| Expert       | 24 to 28      |

It then walks the 81 cells in random order and hides a cell only if the solver still finds exactly one solution. This means the stored solution is the only correct answer, so checking a player's entry against it is always fair. If no further cell can be hidden without allowing a second solution, the puzzle keeps a few more visible cells than the target; in testing (800 puzzles) every puzzle reached its target.

Difficulty is based on the number of visible cells only. It does not grade puzzles by the solving techniques they need.

## Scoring

The constants are in [`src/constants/sudoku.ts`](src/constants/sudoku.ts).

- Every game starts at 500 points.
- A correct digit adds 5 points. Entering the value a cell already has does nothing.
- A wrong digit subtracts 1 point.
- Hints cost 3 points for the first, 4 for the second, 5 for the third and so on, up to 10 hints.
- When the grid is solved, the elapsed time in seconds is subtracted and the result goes to the leaderboard.

## Stack

- [Vue 3.5](https://vuejs.org) with components written in TSX through `@vitejs/plugin-vue-jsx`
- TypeScript, type checked with `vue-tsc`
- [Vite 7](https://vite.dev)
- [Vitest 3](https://vitest.dev) with jsdom and Vue Test Utils
- ESLint 9 (flat config with `eslint-plugin-vue`) and Prettier

Styling uses the design tokens and the Sudoku theme variant of `@eylulg/ui` (compiled stylesheet plus plain CSS variables, no React). Dark mode is the `dark-mode` class on `<html>`, set before first paint by the library's theme script.

State lives in small reactive stores in `src/stores` (`reactive` and `ref` from Vue), without a state library.

## Run it

Requires Node 24 and the `ui` repository checked out next to this one (`../ui`, built with `npm run build`), because `@eylulg/ui` is installed as `file:../ui`. CI checks both out side by side. Once the library is published, the dependency switches to the npm version `^1.0.0`; the GitHub Pages deploy keeps working with the sibling checkout until then.

```bash
npm install
npm run dev          # http://localhost:5173/sudoku/
npm run build        # type check and production build in dist/
npm run preview      # serve the build
```

## Tests and checks

```bash
npm test             # all unit tests, once
npm run test:unit    # watch mode
npm run type-check
npm run lint         # ESLint with --fix
npm run format:check
npm run knip         # unused files, exports and dependencies
```

The tests cover the timer, the generator (valid full grids, solution counting, unique solutions and visible cell counts per difficulty), the puzzle store (scoring, error marking, growing hint costs, undo and redo, finishing a game and the leaderboard), the leaderboard storage helpers, and keyboard navigation and labels in the grid.

## License

[MIT](LICENSE)
