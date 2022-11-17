import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {Repository, UpdateResult} from 'typeorm';

import {Participant} from './participant.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {AddPushTokenDto, CreateParticipantDto} from './create-participant.dto';
import {Pushtoken} from "../pushtoken/pushtoken.entity";
import * as Http from "http";
import * as admin from "firebase-admin";

// import * as admin from 'firebase-admin';

@Injectable()
export class ParticipantsService {
    private readonly logger = new Logger('participantService', {timestamp: true});

    constructor(@InjectRepository(Participant)
                private readonly participantRepo: Repository<Participant>,
                @InjectRepository(Pushtoken)
                private readonly pushTokenRepo: Repository<Pushtoken>
    ) {
    }

    async getAllowedParticipants(): Promise<Participant[]> {
        return this.participantRepo
        .createQueryBuilder('participant')
        .select('*')
        .where('participant.isAllowed')
        .orderBy('participant.createdDate', "ASC")
        .getMany()    
    }

    async findAll(): Promise<Participant[]> {
        return this.participantRepo.find().catch((err) => {
            throw new HttpException({message: err.message, statusCode: HttpStatus.BAD_REQUEST}, HttpStatus.BAD_REQUEST);
        });
    }

    async find(firebaseIdentifier: string): Promise<Participant> {
        return await this.participantRepo
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();    }

    async create(participant: CreateParticipantDto, email: string, uid: string): Promise<Participant> {
        const newParticipant: Participant = Object.assign(participant);
        newParticipant.email = email.toLowerCase();
        newParticipant.firebaseIdentifier = uid;

        await admin.messaging().sendToDevice('fpVQHIYMHkVgpT_nI9hWkw:APA91bE6beYVVTPjapIIxfbHRICnfgGXj7tY9F1xajQidZGERrt4tBIq7sDDa-wddiNiuHWNbhH548qH82-SN0cW9DCmyLGQQ_KMZYpqTQChmT5KixBvx7WV0Cf8ZATmg__BRiYJHwE_', {
            notification: {
                title: 'Het WK Spel',
                body: `${participant.displayName} heeft zich aangemeld.`,
                badge: '0'
            }
        }, {})
            .then(async (response) => {
            })
            .catch(async (error) => console.log(error))
            .finally(async () => {
            });
        return this.participantRepo.save(newParticipant)
            .catch((err) => {
                throw new HttpException({
                    message: err.message,
                    statusCode: HttpStatus.BAD_REQUEST,
                }, HttpStatus.BAD_REQUEST);
            });
    }

    async addPushToken(body: AddPushTokenDto, firebaseIdentifier: string): Promise<({ pushToken: string; participant: Participant } & Pushtoken) | void> {
        const participant = await this.participantRepo
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();

        const pushtokenRecord = await this.pushTokenRepo
            .createQueryBuilder('pushtoken')
            .where('pushtoken.pushToken = :pushtoken', {pushtoken: body.pushtoken})
            .getCount()

        if (pushtokenRecord < 1) {
            return await this.pushTokenRepo
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
    
    async updateDisplayName(body: {id: string, displayName: string}, firebaseIdentifier: string): Promise<any> {
        const participant = await this.participantRepo
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .andWhere('participant.id = :id', {id: body.id})
            .getOne();

        if (participant) {
            return await this.participantRepo
                .createQueryBuilder('participant')
                .update(Participant)
                .set({ displayName: body.displayName })
                .andWhere('participant.id = :id', { id: body.id })
                .execute()
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });
        } else {
            throw new HttpException({
                message: 'We konden je niet correct identificeren, log opnieuw in',
                statusCode: HttpStatus.FORBIDDEN,
            }, HttpStatus.FORBIDDEN);
        }
    }
}
