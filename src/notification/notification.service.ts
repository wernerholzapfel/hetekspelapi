import {Injectable} from '@nestjs/common';
import {Connection, getConnection} from "typeorm";
import * as admin from "firebase-admin";
import {Pushtoken} from "../pushtoken/pushtoken.entity";

@Injectable()
export class NotificationService {

    constructor(private readonly connection: Connection) {
    }

    async sendNotification(): Promise<admin.messaging.MessagingDevicesResponse[]> {
        const pushtokens: Pushtoken[] = await this.connection
            .getRepository(Pushtoken)
            .createQueryBuilder('pushtoken')
            .leftJoin('pushtoken.participant', 'participant')
            .select(['participant.id', 'participant.displayName', 'pushtoken.pushToken'])
            .where('pushtoken.pushToken is not NULL')
            .getMany();


        const messagingDevicesResponse: any[] = []
        await pushtokens.forEach(async token => {
                await admin.messaging().sendToDevice(token.pushToken, {
                    notification: {
                        title: 'Het EK Spel',
                        body: `Hoi ${token.participant.displayName} de stand is bijgewerkt ${new Date}`,
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
                        this.connection
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

