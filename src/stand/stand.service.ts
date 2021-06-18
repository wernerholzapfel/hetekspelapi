import {Injectable, Logger} from '@nestjs/common';
import {Connection} from 'typeorm';
import {Participant} from '../participant/participant.entity';
import * as admin from 'firebase-admin';
import {Hetekspel} from "../hetekspel/hetekspel.entity";
import {Match} from "../match/match.entity";
import {Knockout} from "../knockout/knockout.entity";
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";
import {UpdateKnockoutDto} from "../knockout/create-knockout.dto";
import {Team} from "../team/team.entity";

@Injectable()
export class StandService {
    private readonly logger = new Logger('StandService', true);

    constructor(private readonly connection: Connection) {
    }

    private getSortedPositionStand(sortedStand) {
        this.logger.log('getSortedPositionStand');
        let previousPosition = 1;


        return sortedStand
            .map((participant, index) => {
                if (index > 0 && participant && participant.matchPoints === sortedStand[index - 1].matchPoints) {
                    return {
                        ...participant,
                        matchPosition: previousPosition,
                    };
                } else {
                    previousPosition = index + 1;
                    return {
                        ...participant,
                        matchPosition: index + 1,
                    };
                }
            })
            .map((participant, index) => {
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
        // haal op wat de vorige standnummer was en bepaal wat nieuwe stand nummer wordt
        // indien vorige gelijk is aan huidige, overschrijven.
        // indien vorige groter is dan huidige, huidige overschrijven met nieuwe en vorige met huidige overschrijven.
        // we slaan dan twee standen op (voor snelheid?) current en previous? of 1 stand en berekenen alles hier...

        const db = admin.database();
        let previousTable = [];
        const hetEkspel: Hetekspel = await this.connection.getRepository(Hetekspel).findOne();

        let maxMatchId: any = await this.connection
            .getRepository(Knockout)
            .createQueryBuilder('knockout')
            .select('knockout.ordering')
            .where('knockout.homeScore is not Null')
            .orderBy('knockout.ordering', "DESC")
            .getOne()

        if (!maxMatchId) {
            maxMatchId = await this.connection
                .getRepository(Match)
                .createQueryBuilder('match')
                .select('match.ordering')
                .where('match.homeScore is not Null')
                .orderBy('match.ordering', "DESC")
                .getOne()
        }
        if (!maxMatchId) {
            maxMatchId = {ordering: 0}
        }

        const participants: any = await this.connection
            .getRepository(Participant)
            .createQueryBuilder('participant')
            .select(['participant.displayName', 'participant.id', 'matchPredictions.spelpunten'])
            .addSelect('poulePredictions.spelpunten')
            .addSelect('knockoutPredictions.homeSpelpunten')
            .addSelect('knockoutPredictions.awaySpelpunten')
            .addSelect('knockoutPredictions.winnerSpelpunten')
            .addSelect('knockout.ordering')
            .addSelect('match.ordering')
            .leftJoin('participant.matchPredictions', 'matchPredictions', 'matchPredictions.spelpunten > 0')
            .leftJoin('matchPredictions.match', 'match',)
            .leftJoin('participant.poulePredictions', 'poulePredictions', 'poulePredictions.spelpunten > 0')
            .leftJoin('participant.knockoutPredictions', 'knockoutPredictions', 'knockoutPredictions.homeSpelpunten > 0 or knockoutPredictions.awaySpelpunten > 0 or knockoutPredictions.winnerSpelpunten > 0')
            .leftJoin('knockoutPredictions.knockout', 'knockout')
            .where('participant.isAllowed')
            .getMany();

        const previousTableRef = db.ref(hetEkspel.currentTable.toString());
        await previousTableRef.once('value', async table => {
            previousTable = table.val()
        });

        let currentTable = this.getSortedPositionStand(await this.createStandTillMatchId(participants, maxMatchId.ordering))

        if (previousTable && previousTable.length > 0) {
            currentTable = currentTable.map(t => {
                return {
                    ...t,
                    deltaPosition: previousTable.find(pt => pt.id === t.id).position - t.position,
                    deltaMatchPosition: previousTable.find(pt => pt.id === t.id).matchPosition - t.matchPosition,
                    deltatotalPoints: t.totalPoints - previousTable.find(pt => pt.id === t.id).totalPoints,
                    deltePoulePoints: t.poulePoints - previousTable.find(pt => pt.id === t.id).poulePoints,
                    deltaKnockoutPoints: t.knockoutPoints - previousTable.find(pt => pt.id === t.id).knockoutPoints,
                    deltaMatchPoints: t.matchPoints - previousTable.find(pt => pt.id === t.id).matchPoints
                }
            })
        }

        const docRef = db.ref(`${maxMatchId.ordering}`);
        docRef.set(currentTable);

        await this.connection.getRepository(Hetekspel)
            .save({...hetEkspel, currentTable: maxMatchId.ordering})

        return currentTable;
    }


    createStandTillMatchId(participants: any[], matchId: number) {
        return participants
            .map(participant => {
                return {
                    ...participant,
                    matchPoints: participant.matchPredictions.reduce((a, b) => {
                        if (b.match.ordering <= matchId) {
                            return a + b.spelpunten;
                        } else {
                            return a;
                        }
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
                if (b.totalPoints > a.totalPoints) {
                    return 1
                }
                if (b.totalPoints < a.totalPoints) {
                    return -1
                }
                if (a.displayName.toLowerCase() < b.displayName.toLowerCase()) {
                    return -1;
                }
                if (a.displayName.toLowerCase() > b.displayName.toLowerCase()) {
                    return 1;
                }
                return 0;
            });
    }

    determineKoPoints(knockoutPrediction: KnockoutPrediction, knockoutTeams: Team[] | { id: string }[], round: string, homeTeam: boolean): number {
        if (knockoutPrediction.knockout.round === round) {
            const teamOk = !!knockoutTeams.find(kt => kt.id === (homeTeam ? knockoutPrediction.homeTeam.id : knockoutPrediction.awayTeam.id));

            switch (round) {
                case '16':
                    return teamOk ? 20 : homeTeam ? knockoutPrediction.homeSpelpunten : knockoutPrediction.awaySpelpunten
                case '8':
                    return teamOk ? 35 : homeTeam ? knockoutPrediction.homeSpelpunten : knockoutPrediction.awaySpelpunten
                case '4':
                    return teamOk ? 60 : homeTeam ? knockoutPrediction.homeSpelpunten : knockoutPrediction.awaySpelpunten
                case '2':
                    return teamOk ? 100 : homeTeam ? knockoutPrediction.homeSpelpunten : knockoutPrediction.awaySpelpunten
                default:
                    return null
            }
        } else {
            return null
        }

    }

    determineWinnerPoints(knockoutPrediction: KnockoutPrediction, knockout: UpdateKnockoutDto, round: string): number {
        if (knockoutPrediction.knockout.round === round && round === '2') {
            const winnerOk =
                (knockoutPrediction.homeTeam.id === knockoutPrediction.selectedTeam.id || knockoutPrediction.awayTeam.id === knockoutPrediction.selectedTeam.id) &&
                knockoutPrediction.selectedTeam.id === knockout.winnerTeam.id
            return winnerOk ? 175 : 0
        } else {
            return null
        }
    }
}
