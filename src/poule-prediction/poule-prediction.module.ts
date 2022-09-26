import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {PoulePrediction} from './poule-prediction.entity';
import {PoulePredictionController} from './poule-prediction.controller';
import {PoulePredictionService} from './poule-prediction.service';
import {MatchPredictionService} from "../match-prediction/match-prediction.service";
import {MatchPrediction} from "../match-prediction/match-prediction.entity";
import {StandService} from "../stand/stand.service";
import { Hetekspel } from '../hetekspel/hetekspel.entity';
import { Participant } from '../participant/participant.entity';
import { Knockout } from '../knockout/knockout.entity';
import { Match } from '../match/match.entity';
import { KnockoutPrediction } from '../knockout-prediction/knockout-prediction.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([PoulePrediction, MatchPrediction, Hetekspel, Participant, Knockout, Match, KnockoutPrediction])],
    controllers: [PoulePredictionController],
    providers: [PoulePredictionService, MatchPredictionService, StandService]
})
export class PoulePredictionModule {
}
