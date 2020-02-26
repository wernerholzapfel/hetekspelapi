import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Connection, Repository} from 'typeorm';
import {Team} from './team.entity';
import {CreateTeamDto} from './create-team.dto';

@Injectable()
export class TeamService {
    private readonly logger = new Logger('TeamService', true);

    constructor(private readonly connection: Connection,
                @InjectRepository(Team)
                private readonly repository: Repository<Team>,) {
    }

    async getAll(): Promise<Team[]> {
        return await this.connection
            .getRepository(Team)
            .createQueryBuilder('teams')
            .orderBy('name')
            .getMany();
    }

    async create(team: CreateTeamDto): Promise<Team> {
        return await this.repository.save(team)
            .catch((err) => {
                throw new HttpException({
                    message: err.message,
                    statusCode: HttpStatus.BAD_REQUEST,
                }, HttpStatus.BAD_REQUEST);
            });
    }
}
