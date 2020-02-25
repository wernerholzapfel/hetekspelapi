import {Body, Controller, Get, Logger, Post, Req} from '@nestjs/common';

import {CreateDeelnemerDto} from './create-deelnemer.dto';
import {DeelnemersService} from './deelnemers.service';
import 'dotenv/config';
import {Deelnemer} from './deelnemer.entity';

@Controller('deelnemer')
export class DeelnemersController {
    private readonly logger = new Logger('deelnemersController', true);

    constructor(private readonly deelnemersService: DeelnemersService) {
    }

    @Get()
    async findAll(): Promise<Deelnemer[]> {
        return this.deelnemersService.findAll();
    }

    @Post()
    async create(@Req() req, @Body() createParticipantDto: CreateDeelnemerDto) {
        this.logger.log('post participant');
        const newParticipant = Object.assign({}, createParticipantDto);
        return await this.deelnemersService.create(newParticipant, req.user.email, req.user.uid);
    }
}
