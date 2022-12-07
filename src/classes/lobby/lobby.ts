import { Socket } from 'socket.io';

export class Lobby {
  public readonly id: number;
  // private _players: any[] = [];
  private _sockets: Socket[] = [];
  // private _history: any[] = [];

  constructor() {
    // this.id = Math.ceil(performance.now());
    this.id = 1;
  }

  public joinLobby(socket: Socket) {
    this._sockets.push(socket);

    socket.emit('message', 'joined');
  }
}
