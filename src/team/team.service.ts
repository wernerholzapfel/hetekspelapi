import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Connection, getManager, Repository} from 'typeorm';
import {Team} from './team.entity';
import {CreateTeamDto, UpdateTeamPositionDto} from './create-team.dto';
import {MatchPrediction} from "../match-prediction/match-prediction.entity";
import {PoulePrediction} from "../poule-prediction/poule-prediction.entity";
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";
import {StandService} from "../stand/stand.service";
import {Knockout} from "../knockout/knockout.entity";

@Injectable()
export class TeamService {
    private readonly logger = new Logger('TeamService', true);

    constructor(private readonly connection: Connection,
                @InjectRepository(Team)
                private readonly repository: Repository<Team>,
                private standService: StandService) {
    }

    async getAll(): Promise<Team[]> {
        return await this.connection
            .getRepository(Team)
            .createQueryBuilder('teams')
            .orderBy('name')
            .getMany();
    }

    async update(teamPositionDto: UpdateTeamPositionDto): Promise<(UpdateTeamPositionDto & Team)> {
        return await getManager().transaction(async transactionalEntityManager => {

            const roundIds = await transactionalEntityManager.getRepository(Knockout)
                .createQueryBuilder('knockout')
                .select('knockout.id')
                .where('knockout.round = :round', {round: '16'})
                .getMany()

            this.logger.log(roundIds)
            const team = await transactionalEntityManager.getRepository(Team)
                .save(teamPositionDto)
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });


            if (team.isPositionFinal) {

                await transactionalEntityManager
                    .createQueryBuilder()
                    .update(PoulePrediction)
                    .set({
                        spelpunten: 5,
                    })
                    .where('team.id = :teamId', {teamId: team.id})
                    .andWhere('positie = :positie', {positie: teamPositionDto.poulePosition})
                    .execute()
                    .catch((err) => {
                        throw new HttpException({
                            message: err.message,
                            statusCode: HttpStatus.BAD_REQUEST,
                        }, HttpStatus.BAD_REQUEST);
                    });

                await transactionalEntityManager
                    .createQueryBuilder()
                    .update(PoulePrediction)
                    .set({
                        spelpunten: 0,
                    })
                    .where('team.id = :teamId', {teamId: team.id})
                    .andWhere('positie != :positie', {positie: teamPositionDto.poulePosition})
                    .execute()
                    .catch((err) => {
                        throw new HttpException({
                            message: err.message,
                            statusCode: HttpStatus.BAD_REQUEST,
                        }, HttpStatus.BAD_REQUEST);
                    });
            }

            await transactionalEntityManager
                .createQueryBuilder()
                .leftJoin('knockout', 'knockout')
                .update(KnockoutPrediction)
                .set({
                    homeSpelpunten: team.isEliminated ? null : 20,
                })
                .where("id IN(:...ids)", { ids: [1,2,3] })
                .where('knockout.id IN(:...round)', {round: roundIds.map(r => r.id)})
                .andWhere('homeTeam.id = :teamId', {teamId: team.id})
                .execute()
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });

            await transactionalEntityManager
                .createQueryBuilder()
                .leftJoin('knockout', 'knockout')
                .update(KnockoutPrediction)
                .set({
                    awaySpelpunten: team.isEliminated? null :20,
                })
                .where('knockout.id IN(:...round)', {round: roundIds.map(r => r.id)})
                .andWhere('awayTeam.id = :teamId', {teamId: team.id})
                .execute()
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });
            return team;
        })
    }
}
