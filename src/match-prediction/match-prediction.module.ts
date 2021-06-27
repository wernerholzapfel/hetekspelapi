import {Module} from '@nestjs/common';
import {MatchPredictionController} from './match-prediction.controller';
import {MatchPredictionService} from './match-prediction.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {MatchPrediction} from './match-prediction.entity';
import {StandService} from "../stand/stand.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([MatchPrediction]),
        MatchPredictionModule],
    controllers: [MatchPredictionController],
    providers: [StandService, MatchPredictionService]
})
export class MatchPredictionModule {
}
