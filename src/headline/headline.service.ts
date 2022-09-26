import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Headline} from './headline.entity';
import {CreateHeadlineDto} from './create-headline.dto';
import {Participant} from "../participant/participant.entity";

@Injectable()
export class HeadlineService {

    constructor(@InjectRepository(Headline)
                private readonly headlineRepository: Repository<Headline>,
                @InjectRepository(Participant)
                private readonly participantRepository: Repository<Participant>,) {
    }

    async findAll(): Promise<Headline[]> {
        return await this.headlineRepository
            .createQueryBuilder('headline')
            .where('headline.isActive = :isActive', {isActive: true})
            .orderBy('headline.updatedDate', 'DESC')
            .getMany();
    }


    async create(headline: CreateHeadlineDto, firebaseIdentifier: string): Promise<Headline> {
        const participant = await this.participantRepository
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();

        return await this.headlineRepository.save({...headline, schrijver: participant.displayName})
            .catch((err) => {
                throw new HttpException({
                    message: err.message,
                    statusCode: HttpStatus.BAD_REQUEST,
                }, HttpStatus.BAD_REQUEST);
            });
    }
}
