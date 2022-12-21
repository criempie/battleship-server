import {
  CellState,
  ClientJoinLobbyData,
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
import { time as generateIdByTime } from 'uniqid';

interface LobbyField {
  owner: Player['id'];
  field: Field;
}

export class Lobby {
  private static _fieldSize = 10;
  private static _maxPlayers = 2;

  private _players: Player[] = [];
  private _logger: Logger;
  private _turnQueue = new CycleQueue<Player['id']>();

  public readonly id: string;
  public readonly socketRoomName: string;

  constructor() {
    this.id = generateIdByTime();
    this._logger = new Logger(`${Lobby.name}_${this.id}`);
    this.socketRoomName = `lobby_${this.id}_room`;

    this._logger.log('created');
  }

  public join(socket: Socket, playerInfo?: PlayerInfo): ClientJoinLobbyData {
    let player = playerInfo
      ? this._players.find((p) => p.id === playerInfo.id)
      : null;

    if (!player && this._players.length >= Lobby._maxPlayers) {
      throw new Error('Лобби заполнено');
    }

    const isNewPlayer = !player;

    socket.join(this.socketRoomName);
    socket.on('disconnect', this._onSocketDisconnect.bind(this, socket));

    if (player?.isPreviousSocketId(playerInfo.socketId)) {
      player.socketId = socket.id;
    } else {
      player = new Player(socket.id, new Field(Lobby._fieldSize));
      this._players.push(player);
      this._turnQueue.add(player.id);
    }

    this._logger.log(`player ${player.id} connected`);

    const result: ClientJoinLobbyData = {
      id: this.id,
      player: {
        id: player.id,
        socketId: player.socketId,
      },
    };

    if (!isNewPlayer) {
      result['fields'] = this._players.map((p) => ({
        owner: p.id,
        field: this._formatFieldToSend(p.field),
      }));
    }

    return result;
  }

  public fire(socket: Socket, { x, y }: Coordinates) {
    this._logger.debug(`current turn for ${this._turnQueue.head}`);

    const player = this.getPlayerBySocketId(socket.id);

    if (!player) {
      throw new Error('Игрок не найден');
    }

    if (this._turnQueue.head === player.id) {
      if (x >= Lobby._fieldSize || y >= Lobby._fieldSize || x < 0 || y < 0) {
        throw new Error('Указанные координаты вне игрового поля');
      }

      const fireResult = player.field.fire({ x, y });
      if (!fireResult) throw new Error('Клетка не может быть подстрелена');

      const gameLog: ServerEventGameLog = {
        id: 1,
        fromPlayer: player.id,
        toPlayer: this._turnQueue.tail,
        result: fireResult,
        target: { x, y },
      };

      this._turnQueue.next();
      this._logger.log(`${player?.id} success fire to {${x}, ${y}}}`);
      socket.nsp.to(this.socketRoomName).emit('gameLog', gameLog);
    } else {
      throw new Error('Не ваша очередь');
    }
  }

  public getPlayerBySocketId(socketId: string) {
    return this._players.find((p) => p.socketId === socketId);
  }

  private _formatFieldToSend(field: Field): CellState[][] {
    return field.cells.map((row) => row.map((cell) => cell.state));
  }

  private _onSocketDisconnect(client: Socket, reason: string) {
    const player = this.getPlayerBySocketId(client.id);
    if (player) {
      player.disconnect();
      this._logger.log(`player ${player.id} disconnected`);
    }
  }
}
