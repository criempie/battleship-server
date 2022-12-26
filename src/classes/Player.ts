import {
  CellState,
  MinifiedField,
  Player as Player_,
} from '@battleship/common';
import { process as generateIdByProcess } from 'uniqid';
import { Field } from './Field';

export class Player extends Player_<Field> {
  private _status: 'online' | 'offline';

  public get status() {
    return this._status;
  }

  public get socketId() {
    return this._actualSocketId;
  }

  public set socketId(id: string) {
    this._status = 'online';
    this._changeActualSocketId(id);
  }

  constructor(socketId: string, field: Field) {
    const id = generateIdByProcess();
    super(id, socketId, field);

    this._status = 'online';
  }

  public isPreviousSocketId(socketId: string) {
    return this._previousSocketIds.includes(socketId);
  }

  public connect(newId: string) {
    this.socketId = newId;
  }

  public disconnect() {
    this._status = 'offline';
    this._changeActualSocketId(null);
  }

  public getMinifiedField(
    additionStatesToSkip: CellState[] = [],
  ): MinifiedField {
    const statesToSkip = [CellState.clear, ...additionStatesToSkip];

    return this.field.cells.flat(1).reduce<MinifiedField>((prev, curr) => {
      if (!statesToSkip.includes(curr.state)) {
        prev.push({
          x: curr.x,
          y: curr.y,
          state: curr.state,
        });
      }

      return prev;
    }, []);
    // return this.field.cells.map((row) => row.map((cell) => cell.state));
  }

  private _changeActualSocketId(newId: string | null) {
    if (this._actualSocketId)
      this._previousSocketIds.push(this._actualSocketId);
    this._actualSocketId = newId;
  }
}
