import {
  CellState,
  Coordinates,
  HistoryLog,
  ServerEventGameLog,
  TurnData,
} from '@battleship/common';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Field } from '../Field';
import { CycleQueue } from '../CycleQueue';

interface Cell {
  state: CellState;
}

export class Lobby {
  private static _size = 10;

  private _sockets: Socket[] = [];
  private _history: HistoryLog[] = [];
  private _currentTurn?: string | null;
  private _logger: Logger;
  private _fields = [
    {
      owner: null,
      field: new Field(Lobby._size),
    },
    {
      owner: null,
      field: new Field(Lobby._size),
    },
  ];
  private _turnQueue = new CycleQueue<string>();

  public readonly id: number;

  constructor() {
    this.id = 1;
    this._logger = new Logger(`${Lobby.name}_${this.id}`);
  }

  public async joinLobby(socket: Socket) {
    await socket.join(`lobby_${this.id}_room`);
    this._sockets.push(socket);

    for (const field of this._fields) {
      if (field.owner) continue;
      else {
        field.owner = socket.id;
        this._turnQueue.add(socket.id);
        socket.emit('message', 'joined');
        break;
      }
    }

    this._logger.debug(
      `lobby sockets: ${JSON.stringify(this._fields.map((f) => f.owner))}`,
    );
  }

  public turn(socket: Socket, data: TurnData) {}

  public fire(socket: Socket, { x, y }: Coordinates) {
    this._logger.debug(`current turn for ${this._turnQueue.head}`);
    this._logger.debug(`${socket.id} fire to {${x}, ${y}}}`);

    if (this._turnQueue.head === socket.id) {
      if (x >= Lobby._size || y >= Lobby._size || x < 0 || y < 0) {
        return false;
      }

      const fireResult = this._fields
        .find((f) => f.owner === socket.id)
        .field?.fire({ x, y });

      if (fireResult) {
        const gameLog: ServerEventGameLog = {
          id: 1,
          fromSocketId: socket.id,
          toSocketId: this._turnQueue.tail,
          result: fireResult,
          target: { x, y },
        };

        this._turnQueue.next();
        this._logger.verbose(Array(socket.rooms));
        socket.nsp.to(`lobby_${this.id}_room`).emit('gameLog', gameLog);
      }

      return fireResult;
    } else {
      return false;
    }
  }
}
