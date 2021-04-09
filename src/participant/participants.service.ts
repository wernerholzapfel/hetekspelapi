import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {getConnection, Repository, UpdateResult} from 'typeorm';

import {Participant} from './participant.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {AddPushTokenDto, CreateParticipantDto} from './create-participant.dto';

// import * as admin from 'firebase-admin';

@Injectable()
export class ParticipantsService {
    private readonly logger = new Logger('participantService', true);

    constructor(@InjectRepository(Participant)
                private readonly participantRepository: Repository<Participant>) {
    }

    async findAll(): Promise<Participant[]> {
        return this.participantRepository.find().catch((err) => {
            throw new HttpException({message: err.message, statusCode: HttpStatus.BAD_REQUEST}, HttpStatus.BAD_REQUEST);
        });
    }

    async create(participant: CreateParticipantDto, email: string, uid: string): Promise<Participant> {
        const newParticipant: Participant = Object.assign(participant);
        newParticipant.email = email.toLowerCase();
        newParticipant.firebaseIdentifier = uid;
        return this.participantRepository.save(newParticipant)
            .catch((err) => {
                throw new HttpException({
                    message: err.message,
                    statusCode: HttpStatus.BAD_REQUEST,
                }, HttpStatus.BAD_REQUEST);
            });
    }

    async addPushToken(body: AddPushTokenDto, firebaseIdentifier: string): Promise<UpdateResult> {
        return await getConnection()
            .createQueryBuilder()
            .update(Participant)
            .set({pushToken: body.pushtoken})
            .where("firebaseIdentifier = :firebaseIdentifier", {firebaseIdentifier})
            .execute();
    }
}
