import { Module } from '@nestjs/common';
import { HeadlineController } from './headline.controller';
import { HeadlineService } from './headline.service';
import {Headline} from "./headline.entity";
import {TypeOrmModule} from "@nestjs/typeorm";
import { Participant } from '../participant/participant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Headline, Participant])],
  controllers: [HeadlineController],
  providers: [HeadlineService]
})
export class HeadlineModule {}
