import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {PoulePrediction} from './poule-prediction.entity';
import {PoulePredictionController} from './poule-prediction.controller';
import {PoulePredictionService} from './poule-prediction.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([PoulePrediction]),
        PoulePredictionModule],
    controllers: [PoulePredictionController],
    providers: [PoulePredictionService]
})
export class PoulePredictionModule {
}
