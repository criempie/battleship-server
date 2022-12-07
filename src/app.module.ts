import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LobbyService } from './services/lobby/lobby.service';
import { LobbyController } from './controllers/lobby/lobby.controller';

@Module({
  imports: [],
  controllers: [AppController, LobbyController],
  providers: [AppService, LobbyService],
})
export class AppModule {}
