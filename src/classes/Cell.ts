import { Coordinates } from '@battleship/common';
import { Cell as Cell_ } from '@battleship/common';

export class Cell extends Cell_ {
  constructor(coords: Coordinates) {
    super(coords);
  }
}
