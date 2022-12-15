import { Player as Player_ } from '@battleship/common';

export class Player extends Player_ {
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

  constructor(socketId: string) {
    const id = Math.ceil(performance.now());
    super(id, socketId);
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

  private _changeActualSocketId(newId: string | null) {
    if (this._actualSocketId)
      this._previousSocketIds.push(this._actualSocketId);
    this._actualSocketId = newId;
  }
}
