import {Module} from '@nestjs/common';

import {ParticipantController} from './participant.controller';
import {ParticipantsService} from './participants.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Participant} from './participant.entity';
import { Pushtoken } from '../pushtoken/pushtoken.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Participant, Pushtoken])],
    providers: [ParticipantsService],
    controllers: [ParticipantController],
})

export class ParticipantsModule {
}
