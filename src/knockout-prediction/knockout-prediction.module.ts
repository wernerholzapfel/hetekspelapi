import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {KnockoutPrediction} from "./knockout-prediction.entity";
import {KnockoutPredictionController} from "./knockout-prediction.controller";
import {KnockoutPredictionService} from "./knockout-prediction.service";
import { Participant } from '../participant/participant.entity';
import { Team } from '../team/team.entity';
import { Knockout } from '../knockout/knockout.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([KnockoutPrediction, Knockout, Participant, Team]),
        KnockoutPredictionModule],
    controllers: [KnockoutPredictionController],
    providers: [KnockoutPredictionService]
})
export class KnockoutPredictionModule {
}
