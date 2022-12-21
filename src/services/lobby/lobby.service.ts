import { Injectable, Logger } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Lobby } from 'src/classes/lobby/lobby';
import {
  CellState,
  HistoryLog,
  JoinLobbyData,
  socketSettings,
  TurnData,
  FireData,
  ClientFireData,
  serverLobbyEvents,
  ServerFireData,
  ClientJoinLobbyData,
  ServerJoinLobbyData,
} from '@battleship/common';

@Injectable()
@WebSocketGateway(80, {
  transports: ['websocket'],
  namespace: socketSettings.namespace,
  cors: true,
})
export class LobbyService implements OnGatewayConnection<Socket> {
  private _lobbies: Lobby[] = [];
  private _logger = new Logger(LobbyService.name);

  constructor() {
    this._lobbies.push(new Lobby());
  }

  handleConnection(client: Socket) {
    this._logger.verbose(`socket ${client.id} has connected`);
  }

  public getLobbyById(id: string) {
    return this._lobbies.find((l) => l.id === id);
  }

  public createLobby() {
    const lobby = new Lobby();
    this._lobbies.push(lobby);

    return lobby;
  }

  @SubscribeMessage(serverLobbyEvents.joinLobby)
  public connectSocketToLobby(
    client: Socket,
    { id, player }: ServerJoinLobbyData,
  ): ClientJoinLobbyData | { success: false; reason?: string } {
    const lobby = this.getLobbyById(id);

    if (lobby) {
      try {
        return lobby.join(client, player);
      } catch (e) {
        return { success: false, reason: e?.message };
      }
    } else {
      return { success: false, reason: 'Лобби не найдено' };
    }
  }

  @SubscribeMessage(serverLobbyEvents.fire)
  public fire(
    client: Socket,
    { coords, lobbyId }: ServerFireData,
  ): ClientFireData {
    const lobby = this.getLobbyById(lobbyId);

    if (!lobby) {
      return {
        success: false,
        reason: 'Лобби не существует',
      };
    }

    try {
      this.getLobbyById(lobbyId).fire(client, coords);
      return { success: true };
    } catch (e) {
      return { success: false, reason: e?.message };
    }
  }

  @SubscribeMessage('turn')
  public turn(client: Socket, _data: string) {
    const data = JSON.parse(_data) as TurnData;

    // this.getLobbyById(data.lobbyId).turn(client, data);
  }
}
