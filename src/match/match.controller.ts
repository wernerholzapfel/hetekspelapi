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

    @Get('fullscore')
    async getFullScore(): Promise<Match[]> {
        return this.service.getFullScore();
    }
     @Get('upcoming')
    async getUpcomingMatches(): Promise<Match[]> {
        return this.service.getUpcomingMatches();
    }

    @Get(':id')
    async getMatch( @Param('id') id: string): Promise<Match> {
        return this.service.findMatch(id);
    }


    @Put()
    async create(@Req() req, @Body() createMatchDto: UpdateMatchDto) {
        return await this.service.update(createMatchDto)
    }

}
