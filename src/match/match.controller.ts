import {Body, Controller, Get, Param, Post, Req} from '@nestjs/common';
import {MatchService} from './match.service';
import {Match} from './match.entity';
import {CreateMatchDto} from './create-match.dto';

@Controller('match')
export class MatchController {
    constructor(private readonly service: MatchService) {
    }

    @Get()
    async findMatches(): Promise<Match[]> {
        return this.service.findMatches();
    }

    @Post()
    async create(@Req() req, @Body() createMatchDto: CreateMatchDto) {
        return await this.service.create(createMatchDto)
    }

}
