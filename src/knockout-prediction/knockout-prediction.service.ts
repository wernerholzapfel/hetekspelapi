import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Connection, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Participant} from '../participant/participant.entity';
import {Match} from '../match/match.entity';
import {KnockoutPrediction} from "./knockout-prediction.entity";
import {CreateKnockoutPredictionDto} from "./create-knockout-prediction.dto";

@Injectable()
export class KnockoutPredictionService {

    constructor(private connection: Connection,
                @InjectRepository(KnockoutPrediction)
                private readonly knockoutPredictionRepository: Repository<KnockoutPrediction>) {

    }

    async findKnockoutForParticipant(participantId: string): Promise<KnockoutPrediction[]> {
        return await this.connection
            .getRepository(KnockoutPrediction).createQueryBuilder('knockoutPrediction')
            .leftJoinAndSelect('knockoutPrediction.selectedTeam', 'selectedTeam')
            .leftJoinAndSelect('knockoutPrediction.participant', 'participant')
            .leftJoinAndSelect('knockoutPrediction.homeTeam', 'homeTeam')
            .leftJoinAndSelect('knockoutPrediction.awayTeam', 'awayTeam')
            .leftJoinAndSelect('knockoutPrediction.knockout' , 'knockout')
            .leftJoinAndSelect('knockout.homeTeam', 'kohomeTeam')
            .leftJoinAndSelect('knockout.awayTeam', 'koawayTeam')
            .leftJoinAndSelect('knockout.winnerTeam', 'winnerTeam')
            .where('participant.id = :participantId', {participantId})
            .orderBy('knockout.ordering', "ASC")
            .getMany();

    }

    async createKnockoutPrediction(items: CreateKnockoutPredictionDto[], firebaseIdentifier): Promise<KnockoutPrediction[]> {

        const participant = await this.connection.getRepository(Participant)
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();

        return await this.knockoutPredictionRepository.save(items.map(p => {
            return {
                ...p,
                participant
            }
        }))
            .catch((err) => {
                throw new HttpException({
                    message: err.message,
                    statusCode: HttpStatus.BAD_REQUEST,
                }, HttpStatus.BAD_REQUEST);
            });
    }

    transformMatchToPrediction(i): any {
        return {homeScore: null, awayScore: null, match: i};
    }

}
