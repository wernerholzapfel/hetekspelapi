import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {Repository} from 'typeorm';

import {Deelnemer} from './deelnemer.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {CreateDeelnemerDto} from './create-deelnemer.dto';

// import * as admin from 'firebase-admin';

@Injectable()
export class DeelnemersService {
    private readonly logger = new Logger('deelnemerService', true);

    constructor(@InjectRepository(Deelnemer)
                private readonly deelnemerRepository: Repository<Deelnemer>) {
    }

    async findAll(): Promise<Deelnemer[]> {
        return this.deelnemerRepository.find().catch((err) => {
            throw new HttpException({message: err.message, statusCode: HttpStatus.BAD_REQUEST}, HttpStatus.BAD_REQUEST);
        });
    }

    async create(participant: CreateDeelnemerDto, email: string, uid: string): Promise<Deelnemer> {
        const newParticipant: Deelnemer = Object.assign(participant);
        newParticipant.email = email.toLowerCase();
        newParticipant.firebaseIdentifier = uid;
        return this.deelnemerRepository.save(newParticipant)
            .catch((err) => {
                throw new HttpException({
                    message: err.message,
                    statusCode: HttpStatus.BAD_REQUEST,
                }, HttpStatus.BAD_REQUEST);
            });
    }
}
