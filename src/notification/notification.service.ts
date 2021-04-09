import {Injectable} from '@nestjs/common';
import {Connection} from "typeorm";
import * as admin from "firebase-admin";
import {Participant} from "../participant/participant.entity";

@Injectable()
export class NotificationService {

    constructor(private readonly connection: Connection) {
    }

    async sendNotification(): Promise<admin.messaging.MessagingDevicesResponse[]> {
        const participants: any = await this.connection
            .getRepository(Participant)
            .createQueryBuilder('participant')
            .select(['participant.displayName', 'participant.pushToken',])
            .where('participant.pushToken is not NULL')
            .getMany();

        const messagingDevicesResponse: admin.messaging.MessagingDevicesResponse[] = []
        return participants.map(async p => {
                messagingDevicesResponse.push(await admin.messaging().sendToDevice(p.pushToken, {
                    notification: {
                        title: 'Het EK Spel',
                        body: `Hoi ${p.displayName} de stand is bijgewerkt ${new Date}`,
                        badge: '1'
                    }
                }, {}));
            }
        )
    }
}

