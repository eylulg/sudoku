import { defineComponent, type PropType } from 'vue';

import { setActiveCell, sudokuPuzzle, updateCell } from '@/stores/sudokuPuzzle';

import '@/styles/sudoku-cell.css';

export type CellDirection = 'up' | 'down' | 'left' | 'right';

const ARROW_KEYS: Record<string, CellDirection> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

export default defineComponent({
  name: 'SudokuCell',
  props: {
    cell: {
      type: Object as PropType<SudokuCell>,
      required: true,
    },
    rowLength: {
      type: Number,
      required: true,
    },
    rowIndex: {
      type: Number,
      required: true,
    },
    colIndex: {
      type: Number,
      required: true,
    },
    isTabStop: {
      type: Boolean,
      default: false,
    },
    onNavigate: {
      type: Function as PropType<(direction: CellDirection) => void>,
      default: undefined,
    },
    onCellFocus: {
      type: Function as PropType<(row: number, col: number) => void>,
      default: undefined,
    },
  },
  setup(props) {
    const handleCellChange = (
      row: number,
      col: number,
      value: number | null,
    ) => {
      updateCell(row, col, value);
    };

    const isValidInput = (input: string) => /^[1-9]?$/.test(input);

    const handleInput = (
      e: Event,
      row: number,
      col: number,
      currentValue: number,
    ) => {
      const inputElement = e.target as HTMLInputElement;
      const inputValue = inputElement.value;

      if (isValidInput(inputValue)) {
        const numericValue =
          inputValue === '' ? null : parseInt(inputValue, 10);
        handleCellChange(row, col, numericValue);
      } else {
        inputElement.value = currentValue === 0 ? '' : String(currentValue);
      }
    };

    // Given cells can be focused and read but not changed, so they never
    // become the target for the digit buttons.
    const handleFocus = () => {
      props.onCellFocus?.(props.rowIndex, props.colIndex);
      if (props.cell.prefilled) {
        setActiveCell(null, null);
      } else {
        setActiveCell(props.rowIndex, props.colIndex);
      }
    };

    const handleKeydown = (e: KeyboardEvent) => {
      const direction = ARROW_KEYS[e.key];
      if (!direction) return;
      e.preventDefault();
      props.onNavigate?.(direction);
    };

    const applyBorderRight = () => {
      return props.colIndex % 3 === 2 && props.colIndex !== props.rowLength - 1;
    };

    const ariaLabel = () => {
      const position = `Row ${props.rowIndex + 1}, column ${props.colIndex + 1}`;
      if (props.cell.prefilled && props.cell.value !== 0) {
        return `${position}, given`;
      }
      return props.cell.value === 0 ? `${position}, empty` : position;
    };

    return () => (
      <input
        id={`cell-${props.rowIndex}-${props.colIndex}`}
        name={`cell-${props.rowIndex}-${props.colIndex}`}
        class={[
          'grid-cell',
          applyBorderRight() ? 'border-right' : '',
          props.cell.error ? 'error' : '',
          props.cell.highlight ? 'highlight' : '',
        ]}
        type='text'
        inputmode='numeric'
        autocomplete='off'
        aria-label={ariaLabel()}
        aria-invalid={props.cell.error ? 'true' : undefined}
        tabindex={props.isTabStop ? 0 : -1}
        value={props.cell.value === 0 ? '' : props.cell.value}
        readonly={props.cell.prefilled || sudokuPuzzle.finished}
        onFocus={handleFocus}
        onKeydown={handleKeydown}
        onInput={(e) =>
          handleInput(e, props.rowIndex, props.colIndex, props.cell.value)
        }
      />
    );
  },
});
