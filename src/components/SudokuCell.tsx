import { defineComponent, type PropType } from 'vue';

import {
  checkAndFinishGame,
  setActiveCell,
  updateCell,
} from '@/stores/sudokuPuzzle';

import '@/styles/sudoku-cell.css';

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
  },
  setup(props) {
    const handleCellChange = (
      row: number,
      col: number,
      value: number | null,
    ) => {
      updateCell(row, col, value);
      checkAndFinishGame();
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

    const handleClick = () => {
      setActiveCell(props.rowIndex, props.colIndex);
    };

    const applyBorderRight = () => {
      return props.colIndex % 3 === 2 && props.colIndex !== props.rowLength - 1;
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
        value={props.cell.value === 0 ? '' : props.cell.value}
        disabled={props.cell.prefilled}
        onClick={() => handleClick()}
        onInput={(e) =>
          handleInput(e, props.rowIndex, props.colIndex, props.cell.value)
        }
      />
    );
  },
});
