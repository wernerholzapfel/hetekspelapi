import {Module} from '@nestjs/common';
import {MatchPredictionController} from './match-prediction.controller';
import {MatchPredictionService} from './match-prediction.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {MatchPrediction} from './match-prediction.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([MatchPrediction]),
        MatchPredictionModule],
    controllers: [MatchPredictionController],
    providers: [MatchPredictionService]
})
export class MatchPredictionModule {
}
