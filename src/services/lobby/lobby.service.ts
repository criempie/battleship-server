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
  SocketFireAnswer,
} from '@battleship/common';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

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

  public getLobbyById(id: number) {
    return this._lobbies.find((l) => l.id === id);
  }

  @SubscribeMessage('joinLobby')
  public connectSocketToLobby(client: Socket, _data: string) {
    const { id } = JSON.parse(_data) as JoinLobbyData;

    this.getLobbyById(id).joinLobby(client);

    return id;
  }

  @SubscribeMessage('fire')
  public fire(client: Socket, _data: string): SocketFireAnswer {
    const { coords, lobbyId } = JSON.parse(_data) as FireData;

    const result = this.getLobbyById(lobbyId).fire(client, coords);

    if (result) {
      this._logger.verbose(`fire state ${result} on ${JSON.stringify(coords)}`);
      return {
        success: true,
        state: result,
        target: coords,
        isYourTurn: false,
      };
    }

    return { success: false };
  }

  @SubscribeMessage('turn')
  public turn(client: Socket, _data: string) {
    const data = JSON.parse(_data) as TurnData;

    // this.getLobbyById(data.lobbyId).turn(client, data);
  }
}
