import {Module} from '@nestjs/common';

import {ParticipantController} from './participant.controller';
import {ParticipantsService} from './participants.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Participant} from './participant.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Participant])],
    providers: [ParticipantsService],
    controllers: [ParticipantController],
})

export class ParticipantsModule {
}
