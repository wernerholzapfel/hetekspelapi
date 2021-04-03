import {Injectable, Logger} from '@nestjs/common';
import {Connection} from 'typeorm';
import {Participant} from '../participant/participant.entity';
import * as admin from 'firebase-admin';

@Injectable()
export class StandService {
    private readonly logger = new Logger('StandService', true);

    constructor(private readonly connection: Connection) {
    }

    private getSortedPositionStand(sortedStand) {
        this.logger.log('getSortedPositionStand');
        let previousPosition = 1;

        return sortedStand.map((participant, index) => {
            if (index > 0 && participant && participant.totalPoints === sortedStand[index - 1].totalPoints) {
                return {
                    ...participant,
                    position: previousPosition,
                };
            } else {
                previousPosition = index + 1;
                return {
                    ...participant,
                    position: index + 1,
                };
            }
        });
    }

    async createTotalStand(): Promise<any[]> {
        const sortedPositionStand = await this.getTotalStand();
        const db = admin.database();

        const docRef = db.ref(`totaal`);
        docRef.set(sortedPositionStand);

        const lastUpdatedref = db.ref(`lastUpdated`);
        lastUpdatedref.set({lastUpdated: Date.now()});

        return sortedPositionStand;
    }

    async getTotalStandFromFirebase(): Promise<any> {
        this.logger.log('getTotalStandFB start');
        let totalstand = [];
        let questionStand = [];
        let matchesStand = [];
        let teamStand = [];

        const db = admin.database();

        const teamRef = db.ref('dd0c5fa2-9202-40e9-9505-ff8a3dbb6429/a855cf19-195f-484e-88cc-c9dbc744ae98/Team/totaal'); // todo
        await teamRef.once('value', async teamTotaal => {
            this.logger.log('teamTotaal: ' + teamTotaal.val().length);
            this.logger.log('fb console');
            teamStand = teamTotaal.val();
        });
        const matchesRef = db.ref('matches/totaal'); // todo
        await matchesRef.once('value', async (matches) => {
            this.logger.log('matches: ' + matches.val().length);
            matchesStand = matches.val();
        });

        const questionRef = db.ref('dd0c5fa2-9202-40e9-9505-ff8a3dbb6429/2d6b5514-5375-4800-ae87-9072d1644dfa/Questions/totaal'); // todo
        await questionRef.once('value', async question => {
            this.logger.log('question: ' + question.val().length);

            questionStand = question.val();
        });

        totalstand = teamStand.map(participant => {
            return {
                displayName: participant.displayName,
                id: participant.id,
                teamName: participant.teamName,
                totalTeamPoints: participant.totaalpunten,
                totalRankingPoints: 0,
                totalMatchPoints: matchesStand.length > 0 ? matchesStand.find(m => m.id === participant.id).totalPoints : 0,
                totalQuestionPoints: questionStand.length > 0 ? questionStand.find(q => q.id === participant.id).totalPoints : 0,
            };
        })
            .map(participant => {
                return {
                    ...participant,
                    totalPoints: participant.totalMatchPoints
                        + participant.totalTeamPoints
                        + participant.totalRankingPoints
                        + participant.totalQuestionPoints,
                };
            })
            .sort((a, b) => {
                return b.totalPoints - a.totalPoints;
            });
        return this.getSortedPositionStand(totalstand);
    }

    async getTotalStand(): Promise<any[]> {

        const participants: any = await this.connection
            .getRepository(Participant)
            .createQueryBuilder('participant')
            .select(['participant.displayName', 'participant.id','matchPredictions.spelpunten'])
            .addSelect('poulePredictions.spelpunten')
            .addSelect('knockoutPredictions.homeSpelpunten')
            .addSelect('knockoutPredictions.awaySpelpunten')
            .addSelect('knockoutPredictions.winnerSpelpunten')
            .leftJoin('participant.matchPredictions', 'matchPredictions')
            .leftJoin('participant.poulePredictions', 'poulePredictions')
            .leftJoin('participant.knockoutPredictions', 'knockoutPredictions')
            .getMany();

        this.logger.log(participants);
        const stand = participants
            .map(participant => {
                return {
                    ...participant,
                    matchPoints: participant.matchPredictions.reduce((a, b) => {
                        return a + b.spelpunten;
                    }, 0),
                    poulePoints: participant.poulePredictions.reduce((a, b) => {
                        return a + b.spelpunten;
                    }, 0),
                    knockoutPoints: participant.knockoutPredictions.reduce((a, b) => {
                        return a + b.homeSpelpunten + b.awaySpelpunten + b.winnerSpelpunten;
                    }, 0),
                };
            }).map(participant => {
                return {
                    id: participant.id,
                    displayName: participant.displayName,
                    position: participant.position,
                    matchPoints: participant.matchPoints,
                    poulePoints: participant.poulePoints,
                    knockoutPoints: participant.knockoutPoints,
                    totalPoints: participant.matchPoints + participant.poulePoints + participant.knockoutPoints
                }
            })
            .sort((a, b) => {
                return b.totalPoints - a.totalPoints;
            });

        return this.getSortedPositionStand(stand);
    }

}
