import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Knockout } from "./knockout.entity";
import { CreateKnockoutDto, UpdateKnockoutDto } from "./create-knockout.dto";
import { Participant } from "../participant/participant.entity";
import { KnockoutPrediction } from "../knockout-prediction/knockout-prediction.entity";
import { Team } from "../team/team.entity";
import { Pushtoken } from "../pushtoken/pushtoken.entity";
import { StandService } from "../stand/stand.service";

@Injectable()
export class KnockoutService {
    constructor(@InjectRepository(Knockout)
    private readonly KnockoutRepo: Repository<Knockout>,
        @InjectRepository(KnockoutPrediction)
        private readonly KnockoutPredictionRepo: Repository<KnockoutPrediction>,
        @InjectRepository(Participant)
        private readonly participantRepo: Repository<Participant>,
        private standService: StandService,
        private dataSource: DataSource) {
    }
    private readonly logger = new Logger('KnockoutService', { timestamp: true });

    async findKnockouts(firebaseIdentifier: string): Promise<any[]> { // todo model aanmaken

        const participant = await this.participantRepo
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', { firebaseIdentifier })
            .getOne();

        const knockout: any[] = await this.KnockoutRepo
            .createQueryBuilder('knockout')
            .leftJoinAndSelect('knockout.homeTeam', 'homeTeam')
            .leftJoinAndSelect('knockout.awayTeam', 'awayTeam')
            .leftJoinAndMapOne('knockout.prediction', 'knockout.knockoutPredictions', 'knockoutPredictions', "knockoutPredictions.participant.id = :participantId", { participantId: participant.id })
            .leftJoinAndSelect('knockoutPredictions.selectedTeam', 'selectedTeam')
            .orderBy('knockout.matchId')
            .getMany();

        return knockout.map(ko => {

            const hasPrediction = ko.prediction
            return {
                ...ko,
                selectedTeam: hasPrediction ? { id: ko.prediction.selectedTeam.id } : null
            }
        })
    }

    async getKnockoutResults(): Promise<any[]> { // todo model aanmaken

        const knockout: any[] = await this.KnockoutRepo
            .createQueryBuilder('knockout')
            .leftJoinAndSelect('knockout.homeTeam', 'homeTeam')
            .leftJoinAndSelect('knockout.awayTeam', 'awayTeam')
            .leftJoinAndSelect('knockout.winnerTeam', 'winnerTeam')
            .orderBy('knockout.matchId')
            .getMany();

        return knockout.map(ko => {

            const winnerTeam = ko.winnerTeam
            return {
                ...ko,
                selectedTeam: winnerTeam ? { id: ko.winnerTeam.id } : null
            }
        })
    }

    async getKnockoutsRightPredicted(): Promise<any[]> { // todo model aanmaken

        const knockout: any[] = await this.KnockoutRepo
            .createQueryBuilder('knockout')
            .leftJoinAndSelect('knockout.winnerTeam', 'winnerTeam')
            .leftJoinAndSelect('knockout.knockoutPredictions', 'knockoutPredictions',
                'knockout."winnerTeamId" = "knockoutPredictions"."selectedTeamId"')
            .leftJoinAndSelect('knockoutPredictions.participant', 'participant')
            .leftJoinAndSelect('knockoutPredictions.selectedTeam', 'selectedTeam')
            // .addSelect(['knockoutPredictions.id'])
            // .addSelect(['participant.id', 'participant.displayName'])
            .where('knockout.winnerTeam is not NULL')
            .take(20)
            .orderBy('knockout.matchId', 'DESC')
            .getMany();

        // return knockout.map(async (element) => {
        // const result = await this.KnockoutPredictionRepo
        // .createQueryBuilder('knockoutPrediction')
        // .leftJoinAndSelect('knockoutPrediction.participant', 'participant')
        // .leftJoin('knockoutPrediction.knockout', 'knockout')
        // .where('knockoutPrediction.round = :round', { round: element.round })
        // .andWhere('knockoutPrediction.selectedTeam = :winnerTeamId', { winnerTeamId: element.winnerTeam.id })
        // .getMany();

        // this.logger.log(result)
        // return { ...result };

        // });
        return knockout;
    }


    async create(items: CreateKnockoutDto[]): Promise<Knockout[]> {
        items.forEach(async (item) => {
            await this.KnockoutRepo.save(item)
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });
        })
        return await this.KnockoutRepo.find()
    }

    async update(item: UpdateKnockoutDto): Promise<Knockout> {
        const queryRunner = this.dataSource.createQueryRunner();
        let knockout;
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await this.KnockoutRepo.save(item)
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });

            knockout = await queryRunner.manager.getRepository(Knockout)
                .createQueryBuilder('knockout')
                .leftJoinAndSelect('knockout.homeTeam', 'homeTeam')
                .leftJoinAndSelect('knockout.awayTeam', 'awayTeam')
                .where('knockout.id = :id', { id: item.id })
                .getOne();

            const round = knockout.round != '2' && knockout.round != '3' ? (parseInt(knockout.round) / 2).toString() : knockout.round

            const roundIds = await queryRunner.manager.getRepository(Knockout)
                .createQueryBuilder('knockout')
                .select('knockout.id')
                .where('knockout.round = :round', { round })
                .getMany()

            const maxMatchId: any = await queryRunner.manager.getRepository(Knockout)
                .createQueryBuilder('knockout')
                .select('knockout.ordering')
                .where('knockout.homeScore is not NULL')
                .orderBy('knockout.ordering', "DESC")
                .getOne()

            if (item.id && knockout.round && item.winnerTeam.id) {
                if (knockout.round === '2' || knockout.round === '3') {
                    await queryRunner.manager
                        .createQueryBuilder()
                        .leftJoin('knockout', 'knockout')
                        .update(KnockoutPrediction)
                        .set({
                            winnerSpelpunten: knockout.round === '2' ? 175 : 60,
                            winnerTableId: maxMatchId.ordering
                        })
                        .where('knockout.id IN(:...round)', { round: roundIds.map(r => r.id) })
                        .andWhere('selectedTeam.id = :teamId', { teamId: item.winnerTeam.id })
                        .execute()
                        .catch((err) => {
                            throw new HttpException({
                                message: err.message,
                                statusCode: HttpStatus.BAD_REQUEST,
                            }, HttpStatus.BAD_REQUEST);
                        });

                    // update winnerteam set winner of finales to eliminated false and knockoutround after roundId but before next roundId...
                    await queryRunner.manager.getRepository(Team)
                        .createQueryBuilder()
                        .update(Team)
                        .set({ isEliminated: false, 
                            eliminationRound: knockout.round === '2' ? '1' : '2,5', 
                            latestActiveRound: knockout.round === '2' ? '1' : '2,5' })
                        .where("id = :teamId", { teamId: item.homeTeam.id === item.winnerTeam.id ? item.homeTeam.id : item.awayTeam.id })
                        .execute()
                        .catch((err) => {
                            throw new HttpException({
                                message: err.message,
                                statusCode: HttpStatus.BAD_REQUEST,
                            }, HttpStatus.BAD_REQUEST);
                        });
                } else {
                    await queryRunner.manager
                        .createQueryBuilder()
                        .leftJoin('knockout', 'knockout')
                        .update(KnockoutPrediction)
                        .set({
                            homeSpelpunten: this.standService.getKOPoints(round),
                            homeTableId: maxMatchId.ordering
                        })
                        .where('knockout.id IN(:...round)', { round: roundIds.map(r => r.id) })
                        .andWhere('homeTeam.id = :teamId', { teamId: item.winnerTeam.id })
                        .execute()
                        .catch((err) => {
                            throw new HttpException({
                                message: err.message,
                                statusCode: HttpStatus.BAD_REQUEST,
                            }, HttpStatus.BAD_REQUEST);
                        });

                    await queryRunner.manager
                        .createQueryBuilder()
                        .leftJoin('knockout', 'knockout')
                        .update(KnockoutPrediction)
                        .set({
                            awaySpelpunten: this.standService.getKOPoints(round),
                            awayTableId: maxMatchId.ordering
                        })
                        .where('knockout.id IN(:...round)', { round: roundIds.map(r => r.id) })
                        .andWhere('awayTeam.id = :teamId', { teamId: item.winnerTeam.id })
                        .execute()
                        .catch((err) => {
                            throw new HttpException({
                                message: err.message,
                                statusCode: HttpStatus.BAD_REQUEST,
                            }, HttpStatus.BAD_REQUEST);
                        });
                    // update winner team
                    await queryRunner.manager.getRepository(Team)
                        .createQueryBuilder()
                        .update(Team)
                        .set({ latestActiveRound: this.getNextActiveRound(knockout.round) })
                        .where("id = :teamId", { teamId: item.homeTeam.id === item.winnerTeam.id ? item.homeTeam.id : item.awayTeam.id })
                        .execute()
                        .catch((err) => {
                            throw new HttpException({
                                message: err.message,
                                statusCode: HttpStatus.BAD_REQUEST,
                            }, HttpStatus.BAD_REQUEST);
                        });

                }
                // update loser team
                await queryRunner.manager.getRepository(Team)
                    .createQueryBuilder()
                    .update(Team)
                    .set({ isEliminated: knockout.round === '4' ? false : true, eliminationRound: knockout.round })
                    .where("id = :teamId", { teamId: item.homeTeam.id === item.winnerTeam.id ? item.awayTeam.id : item.homeTeam.id })
                    .execute()
                    .catch((err) => {
                        throw new HttpException({
                            message: err.message,
                            statusCode: HttpStatus.BAD_REQUEST,
                        }, HttpStatus.BAD_REQUEST);
                    });
            }

            await queryRunner.commitTransaction();
        } catch (err) {
            // since we have errors lets rollback the changes we made
            await queryRunner.rollbackTransaction();
        } finally {
            // you need to release a queryRunner which was manually instantiated
            await queryRunner.release();
            return knockout;
        }


        // opslaan match in database


    }

    determineInRound(k: KnockoutPrediction[], prediction: KnockoutPrediction, teamId: string, round: string, homeTeam: boolean): boolean {
        return !!k.find(k => k.knockout.round === round && (k.awayTeam.id === teamId || k.homeTeam.id === teamId)) ? true : homeTeam ? prediction.homeInRound : prediction.awayInRound;
    }
    getNextActiveRound(roundId: string) {
        switch (roundId) {
            case '16':
                return '8'
            case '8':
                return '4'
            case '4':
                return '2'
            case '3':
                return '2,5'
            case '2':
                return '1'
            default:
                return null
        }
    }

}
