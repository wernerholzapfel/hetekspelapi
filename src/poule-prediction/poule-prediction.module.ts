import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {PoulePrediction} from './poule-prediction.entity';
import {PoulePredictionController} from './poule-prediction.controller';
import {PoulePredictionService} from './poule-prediction.service';
import {MatchPredictionService} from "../match-prediction/match-prediction.service";
import {MatchPrediction} from "../match-prediction/match-prediction.entity";
import {StandService} from "../stand/stand.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([PoulePrediction, MatchPrediction]),
        PoulePredictionModule,],
    controllers: [PoulePredictionController],
    providers: [PoulePredictionService, MatchPredictionService, StandService]
})
export class PoulePredictionModule {
}
