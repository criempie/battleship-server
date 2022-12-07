import { Controller, Get, Logger, Param } from '@nestjs/common';
import { LobbyService } from 'src/services/lobby/lobby.service';

@Controller('lobby')
export class LobbyController {
  constructor(private _lobbyService: LobbyService) {}

  @Get('/:id')
  public getLobbyById(@Param('id') id: string) {
    return this._lobbyService.getLobbyById(+id).id;
  }
}
