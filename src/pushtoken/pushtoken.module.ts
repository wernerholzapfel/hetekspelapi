import { Module } from '@nestjs/common';
import { PushtokenController } from './pushtoken.controller';
import { PushtokenService } from './pushtoken.service';

@Module({
  controllers: [PushtokenController],
  providers: [PushtokenService]
})
export class PushtokenModule {}
