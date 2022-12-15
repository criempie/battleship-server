import {
  CellState,
  Coordinates,
  HistoryLog,
  JoinLobbyReturn,
  PlayerInfo,
  ServerEventGameLog,
  TurnData,
} from '@battleship/common';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Field } from '../Field';
import { CycleQueue } from '../CycleQueue';
import { Player } from '../Player';
import { Cell } from '../Cell';

interface LobbyField {
  owner: Player['id'];
  field: Field;
}

export class Lobby {
  private static _size = 10;

  private _sockets: Socket[] = [];
  private _players: Player[] = [];
  private _history: HistoryLog[] = [];
  private _currentTurn?: string | null;
  private _logger: Logger;
  private _fields: LobbyField[];
  private _turnQueue = new CycleQueue<Player['id']>();

  public readonly id: number;
  public readonly socketRoomName: string;

  constructor() {
    this.id = 1;
    this._logger = new Logger(`${Lobby.name}_${this.id}`);
    this.socketRoomName = `lobby_${this.id}_room`;

    this._fields = [
      {
        owner: null,
        field: new Field(Lobby._size),
      },
      {
        owner: null,
        field: new Field(Lobby._size),
      },
    ];
  }

  public join(socket: Socket, playerInfo?: PlayerInfo): JoinLobbyReturn {
    socket.join(this.socketRoomName);

    socket.on('disconnect', this._onSocketDisconnect.bind(this, socket));

    let player = playerInfo
      ? this._players.find((p) => p.id === playerInfo.id)
      : null;

    if (player?.isPreviousSocketId(playerInfo.socketId)) {
      player.socketId = socket.id;
    } else {
      player = new Player(socket.id);
      this._players.push(player);
    }

    this._logger.verbose(this._players);
    // this._sockets.push(socket);

    // for (const field of this._fields) {
    //   if (field.owner) continue;
    //   else {
    //     field.owner = player.id;
    //     this._turnQueue.add(player.id);
    //     socket.emit('message', 'joined');
    //     break;
    //   }
    // }

    this._logger.debug(
      `lobby sockets: ${JSON.stringify(this._fields.map((f) => f.owner))}`,
    );

    return {
      lobbyId: this.id,
      player: {
        id: player.id,
        socketId: player.socketId,
      },
    };
  }

  public turn(socket: Socket, data: TurnData) {}

  public fire(socket: Socket, { x, y }: Coordinates) {
    this._logger.debug(`current turn for ${this._turnQueue.head}`);

    const player = this.getPlayerBySocketId(socket.id);
    this._logger.debug(this._players.map((p) => p.socketId));
    this._logger.debug(`${player?.id} fire to {${x}, ${y}}}`);

    if (!player) {
      return false;
    }

    if (this._turnQueue.head === player.id) {
      if (x >= Lobby._size || y >= Lobby._size || x < 0 || y < 0) {
        return false;
      }

      const fireResult = this._fields
        .find((f) => f.owner === player.id)
        .field?.fire({ x, y });

      if (fireResult) {
        const gameLog: ServerEventGameLog = {
          id: 1,
          fromPlayer: player.id,
          toPlayer: this._turnQueue.tail,
          result: fireResult,
          target: { x, y },
        };

        this._turnQueue.next();
        this._logger.verbose(Array(socket.rooms));
        socket.nsp.to(this.socketRoomName).emit('gameLog', gameLog);
      }

      return fireResult;
    } else {
      return false;
    }
  }

  public getPlayerBySocketId(socketId: string) {
    return this._players.find((p) => p.socketId === socketId);
  }

  private _onSocketDisconnect(client: Socket, reason: string) {
    this.getPlayerBySocketId(client.id)?.disconnect();
  }
}
