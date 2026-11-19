import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import { nextTick } from 'vue';

import SudokuGrid from '@/components/SudokuGrid';
import { sudokuPuzzle } from '@/stores/sudokuPuzzle';
import { generateFullGrid } from '@/utils/sudokuPuzzle';

const cell = (row: number, col: number) =>
  document.getElementById(`cell-${row}-${col}`) as HTMLInputElement;

describe('SudokuGrid keyboard and labels', () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    const solution = generateFullGrid();
    const grid = solution.map((row) => row.map((c) => ({ ...c })));
    grid[0][1] = { ...grid[0][1], value: 0, prefilled: false };
    Object.assign(sudokuPuzzle, {
      solution,
      grid,
      difficulty: 'beginner',
      activeCell: { row: null, col: null },
    });
    wrapper = mount(SudokuGrid, { attachTo: document.body });
  });

  afterEach(() => wrapper.unmount());

  it('labels cells with their position and state', () => {
    expect(cell(0, 0).getAttribute('aria-label')).toBe(
      'Row 1, column 1, given',
    );
    expect(cell(0, 1).getAttribute('aria-label')).toBe(
      'Row 1, column 2, empty',
    );
    expect(cell(0, 0).readOnly).toBe(true);
    expect(cell(0, 1).readOnly).toBe(false);
  });

  it('keeps a single cell in the tab order', () => {
    const tabStops = wrapper
      .findAll('input')
      .filter((input) => input.attributes('tabindex') === '0');
    expect(tabStops).toHaveLength(1);
    expect(tabStops[0].attributes('id')).toBe('cell-0-0');
  });

  it('moves focus with the arrow keys and stops at the edges', async () => {
    cell(0, 0).focus();
    await wrapper.find('#cell-0-0').trigger('keydown', { key: 'ArrowRight' });
    await nextTick();
    expect(document.activeElement).toBe(cell(0, 1));
    expect(sudokuPuzzle.activeCell).toEqual({ row: 0, col: 1 });
    expect(cell(0, 1).tabIndex).toBe(0);
    expect(cell(0, 0).tabIndex).toBe(-1);

    await wrapper.find('#cell-0-1').trigger('keydown', { key: 'ArrowDown' });
    await nextTick();
    expect(document.activeElement).toBe(cell(1, 1));

    await wrapper.find('#cell-1-1').trigger('keydown', { key: 'ArrowUp' });
    await nextTick();
    await wrapper.find('#cell-0-1').trigger('keydown', { key: 'ArrowUp' });
    await nextTick();
    expect(document.activeElement).toBe(cell(0, 1));
  });

  it('does not make a given cell the target for digit buttons', async () => {
    cell(0, 0).focus();
    await nextTick();
    expect(sudokuPuzzle.activeCell).toEqual({ row: null, col: null });
  });
});
