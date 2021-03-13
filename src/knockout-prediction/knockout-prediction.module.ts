import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {KnockoutPrediction} from "./knockout-prediction.entity";
import {KnockoutPredictionController} from "./knockout-prediction.controller";
import {KnockoutPredictionService} from "./knockout-prediction.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([KnockoutPrediction]),
        KnockoutPredictionModule],
    controllers: [KnockoutPredictionController],
    providers: [KnockoutPredictionService]
})
export class KnockoutPredictionModule {
}
