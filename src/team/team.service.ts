import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Connection, getManager, Repository} from 'typeorm';
import {Team} from './team.entity';
import {CreateTeamDto, UpdateTeamPositionDto} from './create-team.dto';
import {MatchPrediction} from "../match-prediction/match-prediction.entity";
import {PoulePrediction} from "../poule-prediction/poule-prediction.entity";
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";
import {StandService} from "../stand/stand.service";

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

            const team = await transactionalEntityManager.getRepository(Team)
                .save(teamPositionDto)
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });


            if (team.isPositionFinal) {
                const poulePredictions: PoulePrediction[] = await transactionalEntityManager
                    .getRepository(PoulePrediction).createQueryBuilder('poulePrediction')
                    .leftJoinAndSelect('poulePrediction.team', 'team')
                    .where('team.id = :teamId', {teamId: team.id})
                    .getMany();

                const updatedPoulePredictions: any[] = [...poulePredictions.map(prediction => {
                    return {
                        ...prediction,
                        spelpunten: prediction.positie === teamPositionDto.poulePosition ? 5 : 0,
                    }
                })];

                await transactionalEntityManager
                    .getRepository(PoulePrediction)
                    .save(updatedPoulePredictions)
                    .catch((err) => {
                        throw new HttpException({
                            message: err.message,
                            statusCode: HttpStatus.BAD_REQUEST,
                        }, HttpStatus.BAD_REQUEST);
                    });
            }
            const knockoutPredictions: KnockoutPrediction[] = await transactionalEntityManager
                .getRepository(KnockoutPrediction).createQueryBuilder('knockoutPrediction')
                .leftJoinAndSelect('knockoutPrediction.selectedTeam', 'selectedTeam')
                .leftJoinAndSelect('knockoutPrediction.participant', 'participant')
                .leftJoinAndSelect('knockoutPrediction.homeTeam', 'homeTeam')
                .leftJoinAndSelect('knockoutPrediction.awayTeam', 'awayTeam')
                .leftJoinAndSelect('knockoutPrediction.knockout', 'knockout')
                .where('knockout.round = :round', {round: '16'})
                .getMany();

            this.logger.log('werner kopred opgehaald');
            const updatedKnockoutPredictions: any[] = [...knockoutPredictions.map(prediction => {
                return {
                    ...prediction,
                    // homeInRound: this.determineInRound(knockoutPredictions.filter(ko => ko.participant.id === prediction.participant.id), prediction, item.homeTeam.id, knockout.round, true),
                    // awayInRound: this.determineInRound(knockoutPredictions.filter(ko => ko.participant.id === prediction.participant.id), prediction, item.homeTeam.id, knockout.round, false),
                    homeSpelpunten: this.standService.determineKoPoints(prediction, [{...team}], '16', true),
                    awaySpelpunten: this.standService.determineKoPoints(prediction, [{...team}], '16', false),
                }
            })];


            await transactionalEntityManager
                .getRepository(KnockoutPrediction)
                .save(updatedKnockoutPredictions)
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
