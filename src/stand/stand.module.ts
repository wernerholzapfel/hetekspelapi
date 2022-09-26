import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Participant} from '../participant/participant.entity';
import {StandService} from './stand.service';
import {StandController} from './stand.controller';
import { Hetekspel } from '../hetekspel/hetekspel.entity';
import { Match } from '../match/match.entity';
import { Knockout } from '../knockout/knockout.entity';
import { HetekspelModule } from '../hetekspel/hetekspel.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Participant, Hetekspel, Knockout, Match]),
    HetekspelModule],
    providers: [StandService],
    controllers: [StandController],
    exports: [StandService]
})
export class StandModule {
}
