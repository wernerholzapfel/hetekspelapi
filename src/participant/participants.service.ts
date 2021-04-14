import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {Connection, getConnection, Repository, UpdateResult} from 'typeorm';

import {Participant} from './participant.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {AddPushTokenDto, CreateParticipantDto} from './create-participant.dto';
import {Pushtoken} from "../pushtoken/pushtoken.entity";
import * as Http from "http";

// import * as admin from 'firebase-admin';

@Injectable()
export class ParticipantsService {
    private readonly logger = new Logger('participantService', true);

    constructor(@InjectRepository(Participant)
                private readonly participantRepository: Repository<Participant>,
                private readonly connection: Connection
    ) {
    }

    async findAll(): Promise<Participant[]> {
        return this.participantRepository.find().catch((err) => {
            throw new HttpException({message: err.message, statusCode: HttpStatus.BAD_REQUEST}, HttpStatus.BAD_REQUEST);
        });
    }

    async find(firebaseIdentifier: string): Promise<Participant> {
        return await this.connection.getRepository(Participant)
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();    }

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

    async addPushToken(body: AddPushTokenDto, firebaseIdentifier: string): Promise<({ pushToken: string; participant: Participant } & Pushtoken) | void> {
        const participant = await this.connection.getRepository(Participant)
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();

        const pushtokenRecord = await this.connection.getRepository(Pushtoken)
            .createQueryBuilder('pushtoken')
            .where('pushtoken.pushToken = :pushtoken', {pushtoken: body.pushtoken})
            .getCount()

        if (pushtokenRecord < 1) {
            return await this.connection.getRepository(Pushtoken)
                .save({participant: participant, pushToken: body.pushtoken})
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });
        } else {
            throw new HttpException({
                message: 'pushtoken al bekend',
                statusCode: HttpStatus.NO_CONTENT,
            }, HttpStatus.NO_CONTENT);
        }

    }
}
