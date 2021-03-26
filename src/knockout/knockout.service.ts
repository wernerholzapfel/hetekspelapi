import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Connection, getManager, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Knockout} from "./knockout.entity";
import {CreateKnockoutDto, UpdateKnockoutDto} from "./create-knockout.dto";
import {Participant} from "../participant/participant.entity";
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";

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
            await this.repository.save(item,)
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });

            const knockout = await this.connection.getRepository(Knockout)
                .createQueryBuilder('knockout')
                .getOne();

            if (item.id && knockout.round && item.winnerTeam.id) {

                const knockoutPredictions: KnockoutPrediction[] = await transactionalEntityManager
                    .getRepository(KnockoutPrediction).createQueryBuilder('knockoutPrediction')
                    .leftJoinAndSelect('knockoutPrediction.selectedTeam', 'selectedTeam')
                    .leftJoinAndSelect('knockoutPrediction.knockout', 'knockout')
                    .where('selectedTeam.id = :selectedTeamId', {selectedTeamId: item.winnerTeam.id})
                    .andWhere('knockout.round = :round', {round: knockout.round})
                    .getMany();

                const updatedKnockoutPredictions: any[] = [...knockoutPredictions.map(prediction => {
                    return {
                        ...prediction,
                        spelpunten: this.determineKoPoints(prediction, knockout.round),
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


    determineKoPoints(knockoutPrediction: KnockoutPrediction, round: string): number {
        if (knockoutPrediction.knockout.round === round) {
            switch (round) {
                case '16':
                    return 25
                case '8':
                    return 45
                case '4':
                    return 80
                case '2':
                    return 150
                default:
                    return null
            }
        } else {
            return null
        }

    }
}
