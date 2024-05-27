import { Injectable, Logger } from '@nestjs/common';
import { Repository } from "typeorm";
import * as admin from "firebase-admin";
import { Pushtoken } from "../pushtoken/pushtoken.entity";
import { Participant } from "../participant/participant.entity";
import { InjectRepository } from '@nestjs/typeorm';
import { response } from 'express';
import { parseJsonText } from 'typescript';

@Injectable()
export class NotificationService {

    constructor(@InjectRepository(Pushtoken)
    private readonly pushTokenRepo: Repository<Pushtoken>,
        @InjectRepository(Participant)
        private readonly participantRepo: Repository<Participant>) {
    }
    private readonly logger = new Logger('NotificationService', { timestamp: true });

    async sendNotification(): Promise<admin.messaging.MessagingDevicesResponse[]> {
        const pushtokens: Pushtoken[] = await this.pushTokenRepo
            .createQueryBuilder('pushtoken')
            .leftJoin('pushtoken.participant', 'participant')
            .select(['participant.id', 'participant.displayName', 'pushtoken.pushToken'])
            .where('pushtoken.isDeleted = false')
            .getMany();


        pushtokens.forEach(async (token) => {
            await admin.messaging().sendToDevice(token.pushToken, {
                notification: {
                    title: 'Het WK Spel',
                    body: `Hoi ${token.participant.displayName}, de stand is bijgewerkt.`,
                    badge: '0'
                }
            }, {})
                .then(async (response) => {
                    this.cleanupToken({ ...response, token })
                })
                .catch(async (error) => console.log(error))
                .finally(async () => {
                });
        }
        )


        // await this.cleanupTokens(messagingDevicesResponse)
        // .then(succes => console.log('succes'))
        // .catch(error => console.log('error: ' + error))
        // .finally(() => console.log('final cleanup'))

        return [];
    }

    async sendReminderNotifcation() {
        const messagingDevicesResponse: any[] = []

        const pushtokens: Pushtoken[] = await this.pushTokenRepo
            .createQueryBuilder('pushtoken')
            .leftJoin('pushtoken.participant', 'participant')
            .select(['participant.id', 'participant.displayName', 'pushtoken.pushToken'])
            .where('pushtoken.pushToken is not NULL')
            .getMany();


        const participantsComplete = await this.participantRepo
            .createQueryBuilder('participant')
            .loadRelationCountAndMap('participant.matchpredictions', 'participant.matchPredictions')
            .loadRelationCountAndMap('participant.poulepredictions', 'participant.poulePredictions')
            .loadRelationCountAndMap('participant.knockoutpredictions', 'participant.knockoutPredictions')
            .select('participant.displayName')
            .addSelect('participant.id')
            .where('participant.isAllowed')
            .groupBy('participant.id')
            .orderBy('participant.createdDate', "ASC")
            .getMany()


        pushtokens.forEach(async token => {
            if (this.participantIsIncomplete(token.participant.id, participantsComplete)) {
            //     await admin.messaging().sendToDevice(token.pushToken, {
            //         notification: {
            //             title: 'Het WK Spel',
            //             body: `Tik tak, tik tak. Je hebt nog tot 16:45 om je voorspelling compleet te maken...`,
            //             badge: '0'
            //         }
            //     }, {})
            //         .then(async response => {
            //             this.logger.log(response)
            //             messagingDevicesResponse.push({...response, token: token})
            //         })
            //         .catch(async error => this.logger.log(error))
            }
        })
        // await this.cleanupTokens(messagingDevicesResponse)
        //     .then(succes => console.log('succes'))
        //     .catch(error => console.log('error: ' + error))
        //     .finally(() => console.log('final cleanup'))

        return messagingDevicesResponse;

    }

    participantIsIncomplete(participantId, participantsComplete: any[]): boolean {
        const participant = participantsComplete.find(p => p.id === participantId)
        const returnValue = (participant && (participant.matchpredictions !== 48 ||
            participant.poulepredictions !== 32 ||
            participant.knockoutpredictions !== 16))

        return returnValue
    }

    // Cleans up the tokens that are no longer valid.
    async cleanupToken(response) {
        return await response.results.forEach((result) => {
            const error = result.error;
            if (error) {
                console.error('Failure sending notification to', response.token.participant.displayName);
                // Cleanup the tokens who are not registered anymore.
                if (error.code === 'messaging/invalid-registration-token' ||
                    error.code === 'messaging/registration-token-not-registered') {
                    console.log('delete this token: ' + response.token.pushToken)
                    this.pushTokenRepo
                        .createQueryBuilder()
                        .update(Pushtoken)
                        .set({ isDeleted: true })
                        .where("pushToken = :pushToken", { pushToken: response.token.pushToken })
                        .execute();
                }
            }
        })
    }
}

