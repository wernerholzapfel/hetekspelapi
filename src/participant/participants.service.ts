import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Repository, UpdateResult } from 'typeorm';

import { Participant } from './participant.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { AddPushTokenDto, CreateParticipantDto } from './create-participant.dto';
import { Pushtoken } from "../pushtoken/pushtoken.entity";
import * as Http from "http";
import * as admin from "firebase-admin";

// import * as admin from 'firebase-admin';

@Injectable()
export class ParticipantsService {
    private readonly logger = new Logger('participantService', { timestamp: true });

    constructor(@InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>,
        @InjectRepository(Pushtoken)
        private readonly pushTokenRepo: Repository<Pushtoken>
    ) {
    }


    async wrongkp(): Promise<any[]> {
        let participant = await this.participantRepo
            .createQueryBuilder('participant')
            .leftJoinAndSelect('participant.knockoutPredictions', 'knockoutPrediction')
            .leftJoinAndSelect('knockoutPrediction.selectedTeam', 'selectedTeam')
            .leftJoinAndSelect('knockoutPrediction.homeTeam', 'homeTeam')
            .leftJoinAndSelect('knockoutPrediction.awayTeam', 'awayTeam')
            .getMany()

        let participantwithfilterkp = participant.map(p => {
            return {
                displayName: p.displayName,
                id: p.id,
                kp: p.knockoutPredictions.filter(kp => {
                    switch (kp.round) {
                        case '16':
                            return false
                        case '8':
                            let kp16 = p.knockoutPredictions.filter(kpp => kpp.round === '16')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp16.includes(kp.homeTeam.id) || !kp16.includes(kp.awayTeam.id)
                        case '4':
                            let kp8 = p.knockoutPredictions.filter(kpp => kpp.round === '8')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp8.includes(kp.homeTeam.id) || !kp8.includes(kp.awayTeam.id)
                        case '2':
                            let kp4 = p.knockoutPredictions.filter(kpp => kpp.round === '4')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp4.includes(kp.homeTeam.id) || !kp4.includes(kp.awayTeam.id)
                        case '1':
                            let kp2 = p.knockoutPredictions.filter(kpp => kpp.round === '2')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp2.includes(kp.homeTeam.id) || !kp2.includes(kp.awayTeam.id)
                        default:
                            return true
                    }
                }),
                homefout: p.knockoutPredictions.filter(kp => {
                    switch (kp.round) {
                        case '16':
                            return false
                        case '8':
                            let kp16 = p.knockoutPredictions.filter(kpp => kpp.round === '16')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp16.includes(kp.homeTeam.id)
                        case '4':
                            let kp8 = p.knockoutPredictions.filter(kpp => kpp.round === '8')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp8.includes(kp.homeTeam.id)
                        case '2':
                            let kp4 = p.knockoutPredictions.filter(kpp => kpp.round === '4')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp4.includes(kp.homeTeam.id)
                        case '1':
                            let kp2 = p.knockoutPredictions.filter(kpp => kpp.round === '2')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp2.includes(kp.homeTeam.id)
                        default:
                            return false
                    }
                }),
                awayfout: p.knockoutPredictions.filter(kp => {
                    switch (kp.round) {
                        case '16':
                            return false
                        case '8':
                            let kp16 = p.knockoutPredictions.filter(kpp => kpp.round === '16')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp16.includes(kp.awayTeam.id)
                        case '4':
                            let kp8 = p.knockoutPredictions.filter(kpp => kpp.round === '8')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp8.includes(kp.awayTeam.id)
                        case '2':
                            let kp4 = p.knockoutPredictions.filter(kpp => kpp.round === '4')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp4.includes(kp.awayTeam.id)
                        case '1':
                            let kp2 = p.knockoutPredictions.filter(kpp => kpp.round === '2')
                                .flatMap(i => i.selectedTeam.id)
                            return !kp2.includes(kp.awayTeam.id)
                        default:
                            return true
                    }
                }),
                selectednietdoor: p.knockoutPredictions.filter(kp => {
                    switch (kp.round) {
                        case '16':
                            let kp8 = p.knockoutPredictions.filter(kpp => kpp.round === '8')
                                .flatMap(i => [i.homeTeam.id, i.awayTeam.id])
                            return !kp8.includes(kp.selectedTeam.id)
                        case '8':
                            let kp4 = p.knockoutPredictions.filter(kpp => kpp.round === '4')
                                .flatMap(i => [i.homeTeam.id, i.awayTeam.id])
                            return !kp4.includes(kp.selectedTeam.id)
                        case '4':
                            let kp2 = p.knockoutPredictions.filter(kpp => kpp.round === '2')
                                .flatMap(i => [i.homeTeam.id, i.awayTeam.id])
                            return !kp2.includes(kp.selectedTeam.id)
                        case '2':
                            return false
                        default:
                            return true
                    }
                })
            }
        })
        .map(result => {
            return {
                participant: {
                    id: result.id,
                    displayName: result.displayName
                },
                kp: result.kp.length,
                homefout: [...result.homefout.map(hf => {
                    return {
                        id: hf.id,
                        round: hf.round,
                        homeTeam: {
                            id: hf.homeTeam.id,
                            name: hf.homeTeam.name
                        }
                    }
                })],
                awayfout: [...result.awayfout.map(af => {
                    return {
                        id: af.id,
                        round: af.round,
                        awayTeam: {
                            id: af.awayTeam.id,
                            name: af.awayTeam.name
                        }
                    }
                })],
                selectednietdoor: [...result.selectednietdoor.map(selnietdoor => {
                    return {
                        id: selnietdoor.id,
                        round: selnietdoor.round,
                        selectedTeam: {
                            id: selnietdoor.selectedTeam.id,
                            name: selnietdoor.selectedTeam.name
                        }
                    }
                })]


            }
        })

        return participantwithfilterkp.filter(pwfkp => pwfkp.kp > 0 || pwfkp.selectednietdoor.length > 0)
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
            throw new HttpException({ message: err.message, statusCode: HttpStatus.BAD_REQUEST }, HttpStatus.BAD_REQUEST);
        });
    }

    async find(firebaseIdentifier: string): Promise<Participant> {
        return await this.participantRepo
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', { firebaseIdentifier })
            .getOne();
    }

    async sendpush() {
        return await admin.messaging().sendToDevice(process.env.pushtoken_participants, {
            notification: {
                title: 'Het EK Spel',
                body: `Test bericht`,
                badge: '0'
            }
        }, {})
            .then(async (response) => {
                this.logger.log(response)
            })
            .catch(async (error) => this.logger.log(error))
            .finally(async () => {
            });
    }

    async create(participant: CreateParticipantDto, email: string, uid: string): Promise<Participant> {
        const newParticipant: Participant = Object.assign(participant);
        newParticipant.email = email.toLowerCase();
        newParticipant.firebaseIdentifier = uid;
        this.logger.log(process.env.pushtoken_participants)
        await admin.messaging().sendToDevice(process.env.pushtoken_participants, {
            notification: {
                title: 'Het EK Spel',
                body: `${participant.displayName} heeft zich aangemeld.`,
                badge: '0'
            }
        }, {})
            .then(async (response) => {
                this.logger.log(response)
            })
            .catch(async (error) => this.logger.log(error))
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
            .where('participant.firebaseIdentifier = :firebaseIdentifier', { firebaseIdentifier })
            .getOne();

        const pushtokenRecord = await this.pushTokenRepo
            .createQueryBuilder('pushtoken')
            .where('pushtoken.pushToken = :pushtoken', { pushtoken: body.pushtoken })
            .getCount()

        if (pushtokenRecord < 1) {
            return await this.pushTokenRepo
                .save({ participant: participant, pushToken: body.pushtoken })
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

    async updateDisplayName(body: { id: string, displayName: string }, firebaseIdentifier: string): Promise<any> {
        const participant = await this.participantRepo
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', { firebaseIdentifier })
            .andWhere('participant.id = :id', { id: body.id })
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
