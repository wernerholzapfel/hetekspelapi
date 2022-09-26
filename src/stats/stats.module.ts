import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnockoutPrediction } from '../knockout-prediction/knockout-prediction.entity';
import { Match } from '../match/match.entity';
import { Participant } from '../participant/participant.entity';
import { Team } from '../team/team.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Participant, KnockoutPrediction, Team, Match])],
  controllers: [StatsController],
  providers: [StatsService]
})
export class StatsModule {}
