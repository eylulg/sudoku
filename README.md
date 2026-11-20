# Sudoku

A Sudoku game in Vue 3 and TypeScript with four difficulty levels, hints, undo and redo, and a local leaderboard. It plays with the keyboard and a screen reader.

Live: https://eylulg.github.io/sudoku/

## Run it

You need Node 24 (see `.nvmrc`). The design system `@eylulg/ui` is a local dependency (`file:../ui`), so build it next to this repo first.

```bash
git clone https://github.com/eylulg/ui ../ui && (cd ../ui && npm install && npm run build)
npm install
npm run dev          # http://localhost:5173/sudoku/
npm run build        # type check and production build in dist/
```

After rebuilding the library, run `npm run relink`.

## How it plays

- Conflicting digits are highlighted in the row, column and box. The digit pad greys out digits already placed nine times.
- A game keeps going after a reload. The timer pauses when the tab is hidden or the window loses focus.
- The top three scores per difficulty are saved in `localStorage`.
- The grid is one tab stop. Arrow keys move between cells and the digits 1 to 9 fill one. Each cell is labelled with its row, column and state.

Scoring (constants in [`src/constants/sudoku.ts`](src/constants/sudoku.ts)): a game starts at 500. A correct digit adds 5 and a wrong one costs 1. Hints cost 3, then 4, then 5 and so on, up to 10 hints. When the grid is solved, the seconds played are subtracted.

## Decisions

**Every puzzle has one solution.** The generator fills a full grid by backtracking, then visits the 81 cells in random order and hides a cell only if a solver still finds exactly one solution. The solver ([`src/utils/sudokuPuzzle.ts`](src/utils/sudokuPuzzle.ts)) stops at two solutions, uses bit masks for each row, column and box, and always fills the cell with the fewest candidates first. The stored solution is then the only correct answer. The cost is that generation does a solver run per hidden cell. If no more cells can be hidden, the puzzle keeps a few more clues than the target.

**Difficulty is the number of visible cells.** Beginner shows 36 to 40, intermediate 32 to 36, hard 28 to 32, expert 24 to 28. It does not grade puzzles by the solving techniques they need, so two puzzles on the same level can feel different.

**No state library.** State is a few reactive stores in `src/stores` built from Vue's `reactive` and `ref`.

## Tests

Vitest with jsdom and Vue Test Utils covers the timer, the generator (valid grids, unique solutions, clue counts per difficulty), the puzzle store (scoring, errors, hint costs, undo and redo, finishing), the leaderboard storage and keyboard navigation in the grid.

```bash
npm test
npm run type-check && npm run ci:lint && npm run format:check && npm run knip
```

## Deploy

CI runs the checks above and a build. The deploy workflow builds with base `/sudoku/`, copies `index.html` to `404.html` and publishes `dist` to GitHub Pages. Both workflows check out `eylulg/ui` next to the app and build it first, because the library is a local dependency. No environment variables are needed.

## License

[MIT](LICENSE)
