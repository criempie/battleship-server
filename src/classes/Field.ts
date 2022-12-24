import { CellState, Coordinates, Field as Field_ } from '@battleship/common';

export class Field extends Field_ {
  constructor(size: number) {
    super(size);
  }

  public fire({ x, y }: Coordinates): CellState {
    const currentState = this._cells[x][y].state;

    switch (currentState) {
      case CellState.clear: {
        this._setStateToCell({ x, y }, CellState.miss);
        return CellState.miss;
      }
      case CellState.ship: {
        this._setStateToCell({ x, y }, CellState.hit);
        return CellState.hit;
      }
      default: {
        throw new Error('Огонь по уже стрелянной клетке');
      }
    }
  }
}
