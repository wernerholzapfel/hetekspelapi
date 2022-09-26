import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Participant } from '../participant/participant.entity';
import { Pushtoken } from '../pushtoken/pushtoken.entity';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pushtoken, Participant])],
  controllers: [NotificationController],
  providers: [NotificationService]
})
export class NotificationModule {}
