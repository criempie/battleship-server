import { Injectable, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Lobby } from 'src/classes/lobby/lobby';

@Injectable()
@WebSocketGateway(80, {
  transports: ['websocket'],
  namespace: 'lobby',
  cors: true,
})
export class LobbyService {
  private _lobbies: Lobby[] = [];

  constructor() {
    this._lobbies.push(new Lobby());
  }

  public getLobbyById(id: number) {
    return this._lobbies.find((l) => l.id === id);
  }

  @SubscribeMessage('joinLobby')
  public connectSocketToLobby(client: Socket, data: string) {
    const temp = JSON.parse(data) as { id: string };
    Logger.verbose(data);

    this.getLobbyById(+temp.id).joinLobby(client);
  }
}
