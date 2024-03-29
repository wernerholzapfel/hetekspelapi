import {Body, CacheTTL, Controller, Get, Logger, Post, Put, Req} from '@nestjs/common';

import {AddPushTokenDto, CreateParticipantDto} from './create-participant.dto';
import {ParticipantsService} from './participants.service';
import 'dotenv/config';
import {Participant} from './participant.entity';

@Controller('participant')
export class ParticipantController {
    private readonly logger = new Logger('ParticipantController', {timestamp: true});

    constructor(private readonly participantsService: ParticipantsService) {
    }


    @Get()
    async findAll(): Promise<Participant[]> {
        return this.participantsService.getAllowedParticipants();
    }

    @Get('mine')
    async find(@Req() req): Promise<Participant> {
        return this.participantsService.find(req.user.uid);
    }
    @Post()
    async create(@Req() req, @Body() createParticipantDto: CreateParticipantDto) {
        this.logger.log('post participant');
        const newParticipant = Object.assign({}, createParticipantDto);
        return await this.participantsService.create(newParticipant, req.user.email, req.user.uid);
    }

    @Put('pushtoken')
    async addPushtoken(@Req() req, @Body() addPushTokenDto: AddPushTokenDto) {
        return await this.participantsService.addPushToken(addPushTokenDto, req.user.uid);
    }

     @Put('displayname')
    async updateDisplayName(@Req() req, @Body() body: {id: string, displayName: string}) {
        return await this.participantsService.updateDisplayName(body, req.user.uid);
    }
}
