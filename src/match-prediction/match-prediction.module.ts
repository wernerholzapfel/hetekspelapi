import {Module} from '@nestjs/common';
import {MatchPredictionController} from './match-prediction.controller';
import {MatchPredictionService} from './match-prediction.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {MatchPrediction} from './match-prediction.entity';
import {StandService} from "../stand/stand.service";
import { HetekspelModule } from '../hetekspel/hetekspel.module';
import { Hetekspel } from '../hetekspel/hetekspel.entity';
import { Participant } from '../participant/participant.entity';
import { Knockout } from '../knockout/knockout.entity';
import { Match } from '../match/match.entity';
import { KnockoutPrediction } from '../knockout-prediction/knockout-prediction.entity';
import { PoulePrediction } from '../poule-prediction/poule-prediction.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([MatchPrediction, Hetekspel, Participant, Knockout, Match, KnockoutPrediction, PoulePrediction])],
    controllers: [MatchPredictionController],
    providers: [StandService, MatchPredictionService]
})
export class MatchPredictionModule {
}
