import {
  CellState,
  ClientJoinLobbyData,
  clientLobbyEvents,
  Coordinates,
  HistoryLog,
  JoinLobbyReturn,
  LobbyLogTypes,
  PlayerInfo,
  ServerEventGameLog,
  serverLobbyEvents,
  ServerLobbyLogData,
  TurnData,
} from '@battleship/common';
import { Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Field } from '../Field';
import { CycleQueue } from '../CycleQueue';
import { Player } from '../Player';
import { time as generateIdByTime } from 'uniqid';

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

  public join(
    socket: Socket,
    playerInfo?: Pick<PlayerInfo, 'id' | 'socketId'>,
  ): ClientJoinLobbyData {
    let player = playerInfo
      ? this._players.find((p) => p.id === playerInfo.id)
      : null;

    if (!player && this._players.length >= Lobby._maxPlayers) {
      throw new Error('Лобби заполнено');
    }

    let isNewPlayer = !player;

    socket.join(this.socketRoomName);
    socket.on('disconnect', this._onSocketDisconnect.bind(this, socket));

    if (player?.isPreviousSocketId(playerInfo.socketId)) {
      player.socketId = socket.id;
    } else {
      player = new Player(socket.id, new Field(Lobby._fieldSize));
      this._players.push(player);
      this._turnQueue.add(player.id);
      isNewPlayer = true;
    }

    const otherPlayers = this._players
      .filter((p) => p.id !== player.id)
      .map((p) => ({
        id: p.id,
        field: p.getMinifiedField(),
      }));

    const lobbyLog: ServerLobbyLogData = {
      id: 1,
      type: isNewPlayer ? LobbyLogTypes.playerJoin : LobbyLogTypes.playerRejoin,
      playerId: player.id,
    };

    socket.to(this.socketRoomName).emit(serverLobbyEvents.lobbyLog, lobbyLog);

    this._logger.log(
      `player ${player.id} ${isNewPlayer ? 'joined' : 'rejoined'}`,
    );

    return {
      id: this.id,
      player: {
        id: player.id,
        socketId: player.socketId,
        field: player.getMinifiedField(),
      },
      otherPlayers,
    };
  }

  public fire(socket: Socket, { x, y }: Coordinates) {
    this._logger.debug(`current turn for ${this._turnQueue.head}`);

    const player = this.getPlayerBySocketId(socket.id);
    const opponent = this._players.find((p) => p.id === this._turnQueue.tail);

    if (!player) {
      throw new Error('Игрок не найден');
    }

    if (this._turnQueue.head === player.id) {
      if (x >= Lobby._fieldSize || y >= Lobby._fieldSize || x < 0 || y < 0) {
        throw new Error('Указанные координаты вне игрового поля');
      }

      const gameLog: ServerEventGameLog = {
        id: 1,
        fromPlayer: player.id,
        toPlayer: this._turnQueue.tail,
        result: opponent.field.fire({ x, y }),
        target: { x, y },
      };

      this._turnQueue.next();
      this._logger.log(`${player?.id} success fire to {${x}, ${y}}}`);
      socket.nsp
        .to(this.socketRoomName)
        .emit(serverLobbyEvents.gameLog, gameLog);
    } else {
      throw new Error('Не ваша очередь');
    }
  }

  public getPlayerBySocketId(socketId: string) {
    return this._players.find((p) => p.socketId === socketId);
  }

  private _onSocketDisconnect(client: Socket, reason: string) {
    const player = this.getPlayerBySocketId(client.id);
    if (player) {
      player.disconnect();

      const lobbyLog: ServerLobbyLogData = {
        id: 1,
        type: LobbyLogTypes.playerLeave,
        playerId: player.id,
      };

      client.to(this.socketRoomName).emit(serverLobbyEvents.lobbyLog, lobbyLog);
      this._logger.log(`player ${player.id} disconnected`);
    }
  }
}
