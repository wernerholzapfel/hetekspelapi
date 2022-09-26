import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Knockout} from "./knockout.entity";
import {KnockoutController} from "./knockout.controller";
import {KnockoutService} from "./knockout.service";
import {StandService} from "../stand/stand.service";
import { Hetekspel } from '../hetekspel/hetekspel.entity';
import { Participant } from '../participant/participant.entity';
import { Match } from '../match/match.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Knockout, Hetekspel, Participant, Match])],
    controllers: [KnockoutController],
    providers: [KnockoutService, StandService]
})
export class KnockoutModule {
}
