import {Body, Controller, Get, Logger, Post, Req} from '@nestjs/common';

import {CreateParticipantDto} from './create-participant.dto';
import {ParticipantsService} from './participants.service';
import 'dotenv/config';
import {Participant} from './participant.entity';

@Controller('participant')
export class ParticipantController {
    private readonly logger = new Logger('ParticipantController', true);

    constructor(private readonly participantsService: ParticipantsService) {
    }

    @Get()
    async findAll(): Promise<Participant[]> {
        return this.participantsService.findAll();
    }

    @Post()
    async create(@Req() req, @Body() createParticipantDto: CreateParticipantDto) {
        this.logger.log('post participant');
        const newParticipant = Object.assign({}, createParticipantDto);
        return await this.participantsService.create(newParticipant, req.user.email, req.user.uid);
    }
}
