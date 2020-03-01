import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Connection, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Participant} from '../participant/participant.entity';
import {PoulePrediction} from './poule-prediction.entity';
import {CreatePoulePredictionDto} from './create-poule-prediction.dto';

@Injectable()
export class PoulePredictionService {

    constructor(private connection: Connection,
                @InjectRepository(PoulePrediction)
                private readonly poulePrediction: Repository<PoulePrediction>) {

    }

    async findPoulePredictionsForParticipant(firebaseIdentifier: string): Promise<PoulePrediction[]> {
        return await this.connection.getRepository(PoulePrediction)
            .createQueryBuilder('pouleprediction')
            .leftJoin('pouleprediction.participant', 'participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            // .orderBy('poulePrediction.poule')
            .getMany();
    }

    async createPoulePrediction(items: CreatePoulePredictionDto[], firebaseIdentifier): Promise<PoulePrediction[]> {

        const participant = await this.connection.getRepository(Participant)
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();

        return await this.poulePrediction.save(items.map(pp => {
            return {
                ...pp,
                team: {id: pp.team.id},
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
}
