import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Team } from './team.entity';
import { CreateTeamDto, UpdateTeamPositionDto } from './create-team.dto';
import { MatchPrediction } from "../match-prediction/match-prediction.entity";
import { PoulePrediction } from "../poule-prediction/poule-prediction.entity";
import { KnockoutPrediction } from "../knockout-prediction/knockout-prediction.entity";
import { StandService } from "../stand/stand.service";
import { Knockout } from "../knockout/knockout.entity";
import { Match } from '../match/match.entity';

@Injectable()
export class TeamService {
    private readonly logger = new Logger('TeamService', { timestamp: true });

    constructor(@InjectRepository(Team)
    private readonly repository: Repository<Team>,
        private standService: StandService,
        private dataSource: DataSource) {
    }

    async getAll(): Promise<Team[]> {
        return await this.repository
            .createQueryBuilder('teams')
            .orderBy('name')
            .getMany();
    }

    async update(teamPositionDto: UpdateTeamPositionDto): Promise<(UpdateTeamPositionDto & Team)> {
        const queryRunner = this.dataSource.createQueryRunner();
        // let team
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const roundIds = await this.dataSource.manager.getRepository(Knockout)
                .createQueryBuilder('knockout')
                .select('knockout.id')
                .where('knockout.round = :round', { round: '16' })
                .getMany()

            const team = await this.dataSource.manager.getRepository(Team)
                .save(teamPositionDto)
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });

                let maxMatchId: any = await this.dataSource.manager.getRepository(Knockout)
                .createQueryBuilder('knockout')
                .select('knockout.ordering')
                .where('knockout.homeScore is not NULL')
                .orderBy('knockout.ordering', "DESC")
                .getOne()
    
            if (!maxMatchId) {
                maxMatchId = await this.dataSource.manager.getRepository(Match)
                    .createQueryBuilder('match')
                    .select('match.ordering')
                    .where('match.homeScore is not Null')
                    .orderBy('match.ordering', "DESC")
                    .getOne()
            }

            if (team.isPositionFinal) {

                await await this.dataSource.manager
                    .createQueryBuilder()
                    .update(PoulePrediction)
                    .set({
                        spelpunten: 5,
                        tableId: maxMatchId.ordering
                    })
                    .where('team.id = :teamId', { teamId: team.id })
                    .andWhere('positie = :positie', { positie: teamPositionDto.poulePosition })
                    .execute()
                    .catch((err) => {
                        throw new HttpException({
                            message: err.message,
                            statusCode: HttpStatus.BAD_REQUEST,
                        }, HttpStatus.BAD_REQUEST);
                    });

                await await this.dataSource.manager
                    .createQueryBuilder()
                    .update(PoulePrediction)
                    .set({
                        spelpunten: 0,
                        tableId: maxMatchId.ordering
                    })
                    .where('team.id = :teamId', { teamId: team.id })
                    .andWhere('positie != :positie', { positie: teamPositionDto.poulePosition })
                    .execute()
                    .catch((err) => {
                        throw new HttpException({
                            message: err.message,
                            statusCode: HttpStatus.BAD_REQUEST,
                        }, HttpStatus.BAD_REQUEST);
                    });
            }

            await await this.dataSource.manager
                .createQueryBuilder()
                .leftJoin('knockout', 'knockout')
                .update(KnockoutPrediction)
                .set({
                    homeSpelpunten: team.isEliminated || team.isEliminated === null ? null : 20,
                    homeTableId: maxMatchId.ordering
                })
                .where('knockout.id IN(:...round)', { round: roundIds.map(r => r.id) })
                .andWhere('homeTeam.id = :teamId', { teamId: team.id })
                .execute()
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });

            await await this.dataSource.manager
                .createQueryBuilder()
                .leftJoin('knockout', 'knockout')
                .update(KnockoutPrediction)
                .set({
                    awaySpelpunten: team.isEliminated || team.isEliminated === null ? null : 20,
                    awayTableId: maxMatchId.ordering
                })
                .where('knockout.id IN(:...round)', { round: roundIds.map(r => r.id) })
                .andWhere('awayTeam.id = :teamId', { teamId: team.id })
                .execute()
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });
            return team;

            await queryRunner.commitTransaction();
        } catch (err) {
            this.logger.log(err);
            // since we have errors lets rollback the changes we made
            await queryRunner.rollbackTransaction();
        } finally {
            // you need to release a queryRunner which was manually instantiated
            await queryRunner.release();
        }
    }
}
