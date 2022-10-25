import {Body, Controller, Get, Logger, Post, Put, Req} from '@nestjs/common';
import {TeamService} from './team.service';
import {CreateTeamDto, UpdateTeamPositionDto} from './create-team.dto';
import {Team} from './team.entity';

@Controller('team')
export class TeamController {
    private readonly logger = new Logger('TeamsController', {timestamp: true});

    constructor(private readonly service: TeamService) {
    }

    @Get()
    async findAll(): Promise<Team[]> {
        return this.service.getAll();
    }
    
    @Get('latestActive')
    async getStillActiveTeams(): Promise<Team[]> {
        return this.service.getStillActiveTeams();
    }

    @Put()
    async update(@Req() req, @Body() UpdateTeamPositionDto: UpdateTeamPositionDto) {
        return await this.service.update(UpdateTeamPositionDto);
    }
}
