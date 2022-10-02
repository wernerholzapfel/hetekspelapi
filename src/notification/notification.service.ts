import {Injectable} from '@nestjs/common';
import {Repository} from "typeorm";
import * as admin from "firebase-admin";
import {Pushtoken} from "../pushtoken/pushtoken.entity";
import {Participant} from "../participant/participant.entity";
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class NotificationService {

    constructor(@InjectRepository(Pushtoken)
    private readonly pushTokenRepo: Repository<Pushtoken>,
    @InjectRepository(Participant)
    private readonly participantRepo: Repository<Participant>) {
    }

    async sendNotification(): Promise<admin.messaging.MessagingDevicesResponse[]> {
        const pushtokens: Pushtoken[] = await this.pushTokenRepo
            .createQueryBuilder('pushtoken')
            .leftJoin('pushtoken.participant', 'participant')
            .select(['participant.id', 'participant.displayName', 'pushtoken.pushToken'])
            .where('pushtoken.pushToken is not NULL')
            .getMany();


        const messagingDevicesResponse: any[] = []
        await pushtokens.forEach(async token => {
                await admin.messaging().sendToDevice(token.pushToken, {
                    notification: {
                        title: 'Het WK Spel',
                        body: `Hoi ${token.participant.displayName} de stand is bijgewerkt.`,
                        badge: '0'
                    }
                }, {})
                    .then(async response => {
                        await messagingDevicesResponse.push({...response, token: token})
                    })
                    .catch(async error => await console.log(error))
            }
        )
        await this.cleanupTokens(messagingDevicesResponse)
            .then(succes => console.log('succes'))
            .catch(error => console.log('error: ' + error))
            .finally(() => console.log('final cleanup'))

        return messagingDevicesResponse;
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
            .leftJoin('participant.matchPredictions', 'matchPredictions')
            .leftJoin('participant.poulePredictions', 'poulePredictions')
            .leftJoin('participant.knockoutPredictions', 'knockoutPredictions')
            .leftJoinAndSelect('participant.pushTokens', 'pushTokens')
            .select('participant.displayName')
            .addSelect('participant.id')
            .addSelect('COUNT(DISTINCT(matchPredictions.id)) as matchPredictions')
            .addSelect('COUNT(DISTINCT(poulePredictions.id)) as poulePredictions')
            .addSelect('COUNT(DISTINCT(knockoutPredictions.id)) as knockoutPredictions')
            .where('participant.isAllowed')
            .groupBy('participant.id')
            .orderBy('participant.createdDate', "ASC")
            .getRawMany()

        await pushtokens.forEach(async token => {
            if (this.participantIsIncomplete(token.participant.id, participantsComplete)) {
                console.log(token.participant.displayName);
                // await admin.messaging().sendToDevice(token.pushToken, {
                //     notification: {
                //         title: 'Het EK Spel',
                //         body: `Hoi ${token.participant.displayName}. Je voorspellingen zijn nog niet compleet. De deadline is al over 3 uur!`,
                //         badge: '0'
                //     }
                // }, {})
                //     .then(async response => {
                //         await messagingDevicesResponse.push({...response, token: token})
                //     })
                //     .catch(async error => await console.log(error))
            }
        })
        // await this.cleanupTokens(messagingDevicesResponse)
        //     .then(succes => console.log('succes'))
        //     .catch(error => console.log('error: ' + error))
        //     .finally(() => console.log('final cleanup'))

        return messagingDevicesResponse;

    }

    participantIsIncomplete(participantId, participantsComplete: any[]): boolean {
        const participant = participantsComplete.find(p => p.participant_id === participantId)

        return (participant && (participant.matchpredictions !== "36" ||
            participant.poulepredictions !== "24" ||
            participant.knockoutpredictions !== "15"))
    }

    // Cleans up the tokens that are no longer valid.
    async cleanupTokens(responses) {
        console.log(responses.length)
        // For each notification we check if there was an error.
        const tokensDelete = [];
        await responses.forEach((response) => {
            response.results.forEach((result) => {
                const error = result.error;
                if (error) {
                    console.log(response.participant)
                    console.error('Failure sending notification to', response.token.participant.displayName);
                    // Cleanup the tokens who are not registered anymore.
                    if (error.code === 'messaging/invalid-registration-token' ||
                        error.code === 'messaging/registration-token-not-registered') {
                        console.log('delete this token: ' + response.token.pushToken)
                        this.pushTokenRepo
                            .createQueryBuilder()
                            .update(Pushtoken)
                            .set({pushToken: null})
                            .where("id = :id", {id: response.token.participant.id})
                            .execute();
                    }
                }
            });
        })
        return Promise.all(tokensDelete);
    }
}

