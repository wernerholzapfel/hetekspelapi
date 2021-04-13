import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Connection, getManager, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Knockout} from "./knockout.entity";
import {CreateKnockoutDto, UpdateKnockoutDto} from "./create-knockout.dto";
import {Participant} from "../participant/participant.entity";
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";
import {Team} from "../team/team.entity";

@Injectable()
export class KnockoutService {
    constructor(private readonly connection: Connection,
                @InjectRepository(Knockout)
                private readonly repository: Repository<Knockout>) {
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

            if (item.id && knockout.round && item.winnerTeam.id) {

                const knockoutPredictions: KnockoutPrediction[] = await transactionalEntityManager
                    .getRepository(KnockoutPrediction).createQueryBuilder('knockoutPrediction')
                    .leftJoinAndSelect('knockoutPrediction.selectedTeam', 'selectedTeam')
                    .leftJoinAndSelect('knockoutPrediction.participant', 'participant')
                    .leftJoinAndSelect('knockoutPrediction.homeTeam', 'homeTeam')
                    .leftJoinAndSelect('knockoutPrediction.awayTeam', 'awayTeam')
                    .leftJoinAndSelect('knockoutPrediction.knockout', 'knockout')
                    .where('knockout.round = :round', {round: knockout.round})
                    .getMany();

                const updatedKnockoutPredictions: any[] = [...knockoutPredictions.map(prediction => {
                    return {
                        ...prediction,
                        // homeInRound: this.determineInRound(knockoutPredictions.filter(ko => ko.participant.id === prediction.participant.id), prediction, item.homeTeam.id, knockout.round, true),
                        // awayInRound: this.determineInRound(knockoutPredictions.filter(ko => ko.participant.id === prediction.participant.id), prediction, item.homeTeam.id, knockout.round, false),
                        homeSpelpunten: this.determineKoPoints(prediction, item, knockout.round, true),
                        awaySpelpunten: this.determineKoPoints(prediction, item, knockout.round, false),
                        winnerSpelpunten: this.determineWinnerPoints(prediction, item, knockout.round),
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


            }

            return knockout
        })
    }

    determineInRound(k: KnockoutPrediction[], prediction: KnockoutPrediction, teamId: string, round: string, homeTeam: boolean): boolean {
        return !!k.find(k => k.knockout.round === round && (k.awayTeam.id === teamId || k.homeTeam.id === teamId)) ? true : homeTeam ? prediction.homeInRound : prediction.awayInRound;
    }

    determineKoPoints(knockoutPrediction: KnockoutPrediction, knockout: UpdateKnockoutDto, round: string, homeTeam: boolean): number {
        if (knockoutPrediction.knockout.round === round) {
            const teamOk = homeTeam ?
                knockoutPrediction.homeTeam.id === knockout.homeTeam.id
                || knockoutPrediction.homeTeam.id === knockout.awayTeam.id :
                knockoutPrediction.awayTeam.id === knockout.homeTeam.id
                || knockoutPrediction.awayTeam.id === knockout.awayTeam.id

            switch (round) {
                case '16':
                    return teamOk ? 10 : homeTeam ? knockoutPrediction.homeSpelpunten : knockoutPrediction.awaySpelpunten
                case '8':
                    return teamOk ? 25 : homeTeam ? knockoutPrediction.homeSpelpunten : knockoutPrediction.awaySpelpunten
                case '4':
                    return teamOk ? 45 : homeTeam ? knockoutPrediction.homeSpelpunten : knockoutPrediction.awaySpelpunten
                case '2':
                    return teamOk ? 80 : homeTeam ? knockoutPrediction.homeSpelpunten : knockoutPrediction.awaySpelpunten
                default:
                    return null
            }
        } else {
            return null
        }

    }

    determineWinnerPoints(knockoutPrediction: KnockoutPrediction, knockout: UpdateKnockoutDto, round: string): number {
        if (knockoutPrediction.knockout.round === round && round === '2') {
            const winnerOk =
                (knockoutPrediction.homeTeam.id === knockoutPrediction.selectedTeam.id || knockoutPrediction.awayTeam.id === knockoutPrediction.selectedTeam.id) &&
                knockoutPrediction.selectedTeam.id === knockout.winnerTeam.id
            return winnerOk ? 150 : 0
        } else {
            return null
        }
    }
}
