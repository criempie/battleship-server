import { CellState, Coordinates } from '@battleship/common';
import { Logger } from '@nestjs/common';

export class Cell {
  private _state: CellState = CellState.clear;

  // public readonly x: number;
  // public readonly y: number;

  public get state() {
    return this._state;
  }

  // constructor({ x, y }: Coordinates) {
  //   this.x = x;
  //   this.y = y;
  // }

  fire() {
    switch (this._state) {
      case CellState.clear: {
        this._state = CellState.miss;
        return CellState.miss;
      }
      case CellState.ship: {
        this._state = CellState.hit;
        return CellState.hit;
      }
      default: {
        return false;
      }
    }
  }
}
