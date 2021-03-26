import {Body, Controller, Get, Param, Post, Put, Req} from '@nestjs/common';
import {MatchService} from './match.service';
import {Match} from './match.entity';
import {UpdateMatchDto} from './update-match.dto';

@Controller('match')
export class MatchController {
    constructor(private readonly service: MatchService) {
    }

    @Get()
    async findMatches(): Promise<Match[]> {
        return this.service.findMatches();
    }

    @Put()
    async create(@Req() req, @Body() createMatchDto: UpdateMatchDto) {
        return await this.service.update(createMatchDto)
    }

}
