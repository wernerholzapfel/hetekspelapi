import {Body, Controller, Get, Logger, Post, Req} from '@nestjs/common';
import {TeamService} from './team.service';
import {CreateTeamDto} from './create-team.dto';
import {Team} from './team.entity';

@Controller('team')
export class TeamController {
    private readonly logger = new Logger('TeamsController', true);

    constructor(private readonly service: TeamService) {
    }

    @Get()
    async findAll(): Promise<Team[]> {
        return this.service.getAll();
    }

    @Post()
    async create(@Req() req, @Body() createDto: CreateTeamDto) {
        const newObject = Object.assign({}, createDto);
        return await this.service.create(newObject);
    }
}
