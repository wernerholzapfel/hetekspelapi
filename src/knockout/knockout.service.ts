import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Connection, getManager, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Knockout} from "./knockout.entity";
import {CreateKnockoutDto, UpdateKnockoutDto} from "./create-knockout.dto";
import {Participant} from "../participant/participant.entity";
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";
import {Team} from "../team/team.entity";
import {Pushtoken} from "../pushtoken/pushtoken.entity";
import {StandService} from "../stand/stand.service";

@Injectable()
export class KnockoutService {
    constructor(private readonly connection: Connection,
                @InjectRepository(Knockout)
                private readonly repository: Repository<Knockout>,
                private standService: StandService) {
    }

    async findKnockouts(firebaseIdentifier: string): Promise<any[]> { // todo model aanmaken

        const participant = await this.connection.getRepository(Participant)
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();

        const knockout: any[] = await this.connection.getRepository(Knockout)
            .createQueryBuilder('knockout')
            .leftJoinAndSelect('knockout.homeTeam', 'homeTeam')
            .leftJoinAndSelect('knockout.awayTeam', 'awayTeam')
            .leftJoinAndMapOne('knockout.prediction', 'knockout.knockoutPredictions', 'knockoutPredictions', "knockoutPredictions.participant.id = :participantId", {participantId: participant.id})
            .leftJoinAndSelect('knockoutPredictions.selectedTeam', 'selectedTeam')
            .orderBy('knockout.matchId')
            .getMany();

        return knockout.map(ko => {

            const hasPrediction = ko.prediction
            return {
                ...ko,
                selectedTeam: hasPrediction ? {id: ko.prediction.selectedTeam.id} : null
            }
        })
    }

    async getKnockoutResults(): Promise<any[]> { // todo model aanmaken

        const knockout: any[] = await this.connection.getRepository(Knockout)
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
                selectedTeam: winnerTeam ? {id: ko.winnerTeam.id} : null
            }
        })
    }


    async create(items: CreateKnockoutDto[]): Promise<Knockout[]> {
        await items.forEach(async item => {
            await this.repository.save(item)
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });
        })
        return await this.repository.find()
    }

    async update(item: UpdateKnockoutDto): Promise<Knockout> {
        return await getManager().transaction(async transactionalEntityManager => {

            // opslaan match in database
            await this.repository.save(item)
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });

            const knockout = await this.connection.getRepository(Knockout)
                .createQueryBuilder('knockout')
                .leftJoinAndSelect('knockout.homeTeam', 'homeTeam')
                .leftJoinAndSelect('knockout.awayTeam', 'awayTeam')
                .where('knockout.id = :id', {id: item.id})
                .getOne();

            const round = knockout.round != '2' ? (parseInt(knockout.round) / 2).toString() : knockout.round

            const roundIds = await transactionalEntityManager.getRepository(Knockout)
                .createQueryBuilder('knockout')
                .select('knockout.id')
                .where('knockout.round = :round', {round})
                .getMany()


            if (item.id && knockout.round && item.winnerTeam.id) {

                    await transactionalEntityManager
                        .createQueryBuilder()
                        .leftJoin('knockout', 'knockout')
                        .update(KnockoutPrediction)
                        .set({
                            homeSpelpunten: this.standService.getKOPoints(round),
                        })
                        .where('knockout.id IN(:...round)', {round: roundIds.map(r => r.id)})
                        .andWhere('homeTeam.id = :teamId', {teamId: item.winnerTeam.id})
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
                            awaySpelpunten: this.standService.getKOPoints(round),
                        })
                        .where('knockout.id IN(:...round)', {round: roundIds.map(r => r.id)})
                        .andWhere('awayTeam.id = :teamId', {teamId: item.winnerTeam.id})
                        .execute()
                        .catch((err) => {
                            throw new HttpException({
                                message: err.message,
                                statusCode: HttpStatus.BAD_REQUEST,
                            }, HttpStatus.BAD_REQUEST);
                        });
                if (knockout.round === '2') {
                    await transactionalEntityManager
                        .createQueryBuilder()
                        .leftJoin('knockout', 'knockout')
                        .update(KnockoutPrediction)
                        .set({
                            winnerSpelpunten: 175,
                        })
                        .where('knockout.id IN(:...round)', {round: roundIds.map(r => r.id)})
                        .andWhere('selectedTeam.id = :teamId', {teamId: item.winnerTeam.id})
                        .execute()
                        .catch((err) => {
                            throw new HttpException({
                                message: err.message,
                                statusCode: HttpStatus.BAD_REQUEST,
                            }, HttpStatus.BAD_REQUEST);
                        });
                }
                await transactionalEntityManager
                    .getRepository(Team)
                    .createQueryBuilder()
                    .update(Team)
                    .set({isEliminated: true, eliminationRound: knockout.round})
                    .where("id = :teamId", {teamId: item.homeTeam.id === item.winnerTeam.id ? item.awayTeam.id : item.homeTeam.id})
                    .execute()
                    .catch((err) => {
                        throw new HttpException({
                            message: err.message,
                            statusCode: HttpStatus.BAD_REQUEST,
                        }, HttpStatus.BAD_REQUEST);
                    });
            }

            return knockout
        })
    }

    determineInRound(k: KnockoutPrediction[], prediction: KnockoutPrediction, teamId: string, round: string, homeTeam: boolean): boolean {
        return !!k.find(k => k.knockout.round === round && (k.awayTeam.id === teamId || k.homeTeam.id === teamId)) ? true : homeTeam ? prediction.homeInRound : prediction.awayInRound;
    }


}
