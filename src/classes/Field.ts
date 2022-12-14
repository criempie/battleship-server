import { Coordinates } from '@battleship/common';
import { Logger } from '@nestjs/common';
import { Cell } from './Cell';

export class Field {
  private _cells: Cell[][];
  // private _ships: any[];

  public get cells() {
    return this._cells.slice();
  }

  constructor(size: number) {
    this._cells = Field._generateCells(size);
  }

  public fire({ x, y }: Coordinates) {
    return this._cells[x][y].fire();
  }

  public static _generateCells(size: number) {
    return Array(size)
      .fill(null)
      .map((_, x) =>
        Array(size)
          .fill(null)
          .map((_, y) => new Cell()),
      );
  }
}
