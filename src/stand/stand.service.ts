import { Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Participant } from '../participant/participant.entity';
import * as admin from 'firebase-admin';
import { Hetekspel } from "../hetekspel/hetekspel.entity";
import { Match } from "../match/match.entity";
import { Knockout } from "../knockout/knockout.entity";
import { KnockoutPrediction } from "../knockout-prediction/knockout-prediction.entity";
import { UpdateKnockoutDto } from "../knockout/create-knockout.dto";
import { Team } from "../team/team.entity";
import { InjectRepository } from '@nestjs/typeorm';
import { MatchPrediction } from '../match-prediction/match-prediction.entity';
import { PoulePrediction } from '../poule-prediction/poule-prediction.entity';
import { ppid } from 'process';

@Injectable()
export class StandService {
    private readonly logger = new Logger('StandService', { timestamp: true });

    constructor(
        @InjectRepository(Hetekspel)
        private readonly hetEKSPELRepo: Repository<Hetekspel>,
        @InjectRepository(Participant)
        private readonly ParticipantRepo: Repository<Participant>,
        @InjectRepository(Knockout)
        private readonly KnockoutRepo: Repository<Knockout>,
        @InjectRepository(Match)
        private readonly MatchRepo: Repository<Match>) {
    }

    private getSortedPositionStand(sortedStand) {
        this.logger.log('getSortedPositionStand');
        this.logger.log(sortedStand);
        let previousMatchPosition = 1;
        let matchPosition = 1
        let previousTotalPosition = 1;
        let totalPosition = 1

        const sortedPreviousMatchStand = sortedStand
        .sort((a, b) => {
            if (b.matchPoints - b.deltaMatchPoints > a.matchPoints - a.deltaMatchPoints) {
                return 1
            }
            if (b.matchPoints - b.deltaMatchPoints < a.matchPoints - a.deltaMatchPoints) {
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

        const positionSortedPreviousMatchStand = sortedPreviousMatchStand.map((participant, index) => {
            if (index > 0 && participant && participant.matchPoints - participant.deltaMatchPoints === sortedPreviousMatchStand[index - 1].matchPoints - sortedPreviousMatchStand[index - 1].deltaMatchPoints) {
                return {
                    ...participant,
                    previousMatchPosition,
                };
            } else {
                previousMatchPosition = index + 1;
                return {
                    ...participant,
                    previousMatchPosition: index + 1,
                };
            }
        })

        const sortedMatchStand = positionSortedPreviousMatchStand
            .sort((a, b) => {
                if (b.matchPoints > a.matchPoints) {
                    return 1
                }
                if (b.matchPoints < a.matchPoints) {
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


        const positionSortedMatchStand = sortedMatchStand.map((participant, index) => {
            if (index > 0 && participant && participant.matchPoints === sortedMatchStand[index - 1].matchPoints) {
                return {
                    ...participant,
                    matchPosition: matchPosition,
                };
            } else {
                matchPosition = index + 1;
                return {
                    ...participant,
                    matchPosition: index + 1,
                };
            }
        })

        const sortedPreviousTotalStand = positionSortedMatchStand
        .sort((a, b) => {
            if (b.totalPoints - b.deltaMatchPoints - b.deltaPoulePoints - b.deltaKnockoutPoints > a.totalPoints - a.deltaMatchPoints - a.deltaPoulePoints - a.deltaKnockoutPoints) {
                return 1
            }
            if (b.totalPoints - b.deltaMatchPoints - b.deltaPoulePoints - b.deltaKnockoutPoints < a.totalPoints - a.deltaMatchPoints - a.deltaPoulePoints - a.deltaKnockoutPoints) {
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


        const positionSortedPreviousTotalStand = sortedPreviousTotalStand.map((participant, index) => {
            if (index > 0 && participant && participant.totalPoints - participant.deltaMatchPoints - participant.deltaPoulePoints - participant.deltaKnockoutPoints  
                 === sortedPreviousTotalStand[index - 1].totalPoints - sortedPreviousTotalStand[index - 1].deltaMatchPoints - sortedPreviousTotalStand[index - 1].deltaPoulePoints - sortedPreviousTotalStand[index - 1].deltaKnockoutPoints ) {
                return {
                    ...participant,
                    previousPosition: previousTotalPosition,
                };
            } else {
                previousTotalPosition = index + 1;
                return {
                    ...participant,
                    previousPosition: index + 1,
                };
            }
        })

        const sortedtotaalStand = positionSortedPreviousTotalStand
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
            })

        const sortedTotaalStandPosition = sortedtotaalStand.map((participant, index) => {
            if (index > 0 && participant && participant.totalPoints === sortedtotaalStand[index - 1].totalPoints) {
                return {
                    ...participant,
                    position: totalPosition,
                };
            } else {
                totalPosition = index + 1;
                return {
                    ...participant,
                    position: index + 1,
                };
            }
        });

        return sortedTotaalStandPosition

    }

    async createTotalStand(): Promise<any[]> {
        const sortedPositionStand = await this.getTotalStand();
        const db = admin.database();

        this.logger.log(sortedPositionStand);
        const docRef = db.ref(`totaal`);
        docRef.set(sortedPositionStand);

        const lastUpdatedref = db.ref(`lastUpdated`);
        lastUpdatedref.set({ lastUpdated: Date.now() });

        return sortedPositionStand;
    }

    async getTotalStand(): Promise<any[]> {
        // haal op wat de vorige standnummer was en bepaal wat nieuwe stand nummer wordt
        // indien vorige gelijk is aan huidige, overschrijven.
        // indien vorige groter is dan huidige, huidige overschrijven met nieuwe en vorige met huidige overschrijven.
        // we slaan dan twee standen op (voor snelheid?) current en previous? of 1 stand en berekenen alles hier...

        const db = admin.database();
        let hetEkspel: Hetekspel = await this.hetEKSPELRepo.findOneBy({});

        let maxMatchId: any = await this.KnockoutRepo
            .createQueryBuilder('knockout')
            .select('knockout.ordering')
            .where('knockout.homeScore is not NULL')
            .orderBy('knockout.ordering', "DESC")
            .getOne()

        if (!maxMatchId) {
            maxMatchId = await this.MatchRepo
                .createQueryBuilder('match')
                .select('match.ordering')
                .where('match.homeScore is not Null')
                .orderBy('match.ordering', "DESC")
                .getOne()
        }
        if (!maxMatchId) {
            maxMatchId = { ordering: 0 }
        }

        this.logger.log(maxMatchId.ordering);
        hetEkspel = {...hetEkspel, currentTable: 5}

        const participants: any = await this.ParticipantRepo
            .createQueryBuilder('participant')
            .select(['participant.displayName', 'participant.id'])
            .addSelect((subQuery) => {
                return subQuery.select('SUM(COALESCE("spelpunten",0))', 'matchPoints')
                    .from(MatchPrediction, 'mp')
                    .where('mp."participantId" = "participant".id')
                    .groupBy('"participantId"');
            }, 'matchPoints')
             .addSelect((subQuery) => {
                return subQuery.select('SUM(COALESCE("spelpunten",0))', 'deltaMatchPoints')
                    .from(MatchPrediction, 'mp')
                    .where('mp."participantId" = "participant".id')
                    .andWhere('mp.tableId > :previousTableId', {previousTableId: hetEkspel.currentTable})
                    .andWhere('mp.tableId <= :newTableId', {newTableId: maxMatchId.ordering})
                    .groupBy('"participantId"');
            }, 'deltaMatchPoints')
             .addSelect((subQuery) => {
                return subQuery.select('SUM(COALESCE("spelpunten",0))', 'poulePoints')
                    .from(PoulePrediction, 'pp')
                    .where('pp."participantId" = "participant".id')
                    .groupBy('"participantId"');
            }, 'poulePoints')
              .addSelect((subQuery) => {
                return subQuery.select('SUM(COALESCE("spelpunten",0))', 'deltaPoulePoints')
                    .from(PoulePrediction, 'dpp')
                    .where('dpp."participantId" = "participant".id')
                    .andWhere('dpp.tableId > :previousTableId', {previousTableId: hetEkspel.currentTable})
                    .andWhere('dpp.tableId <= :newTableId', {newTableId: maxMatchId.ordering})
                    .groupBy('"participantId"');
            }, 'deltaPoulePoints')
            .addSelect((subQuery) => {
                return subQuery.select('COALESCE(SUM(COALESCE("homeSpelpunten",0) + COALESCE("awaySpelpunten",0) + COALESCE("winnerSpelpunten",0)),0)', 'knockoutPoints')
                    .from(KnockoutPrediction, 'kp')
                    .where('kp."participantId" = "participant".id')
                    .groupBy('"participantId"');
            }, 'knockoutPoints')
              .addSelect((subQuery) => {
                return subQuery.select('SUM(COALESCE("homeSpelpunten",0))', 'deltaHomeKnockoutPoints')
                    .from(KnockoutPrediction, 'kp')
                    .where('kp."participantId" = "participant".id')
                    .andWhere('kp.homeTableId > :previousTableId', {previousTableId: hetEkspel.currentTable})
                    .andWhere('kp.homeTableId <= :newTableId', {newTableId: maxMatchId.ordering})
                    .groupBy('"participantId"');
            }, 'deltaHomeKnockoutPoints')
              .addSelect((subQuery) => {
                return subQuery.select('SUM(COALESCE("awaySpelpunten",0))', 'deltaAwayKnockoutPoints')
                    .from(KnockoutPrediction, 'kp')
                    .where('kp."participantId" = "participant".id')
                    .andWhere('kp.awayTableId > :previousTableId', {previousTableId: hetEkspel.currentTable})
                    .andWhere('kp.awayTableId <= :newTableId', {newTableId: maxMatchId.ordering})
                    .groupBy('"participantId"');
            }, 'deltaAwayKnockoutPoints')
              .addSelect((subQuery) => {
                return subQuery.select('SUM(COALESCE("winnerSpelpunten",0))', 'deltaWinnerKnockoutPoints')
                    .from(KnockoutPrediction, 'kp')
                    .where('kp."participantId" = "participant".id')
                    .andWhere('kp.winnerTableId > :previousTableId', {previousTableId: hetEkspel.currentTable})
                    .andWhere('kp.winnerTableId <= :newTableId', {newTableId: maxMatchId.ordering})
                    .groupBy('"participantId"');
            }, 'deltaWinnerKnockoutPoints')
            .where('participant.isAllowed')
            .groupBy('participant.id')
            .getRawMany();

        this.logger.log("participants");
        this.logger.log(participants);

        let currentTable = this.getSortedPositionStand(participants.map(p => {
            return {
                id: p.participant_id,
                displayName: p.participant_displayName,
                matchPoints: p.matchPoints ? parseInt(p.matchPoints, 10) :0 ,
                knockoutPoints: p.knockoutPoints ? parseInt(p.knockoutPoints, 10):0,
                poulePoints: p.poulePoints ? parseInt(p.poulePoints, 10):0,
                deltaMatchPoints: p.deltaMatchPoints ? parseInt(p.deltaMatchPoints, 10):0,
                deltaKnockoutPoints: 
                    p.deltaHomeKnockoutPoints ? parseInt(p.deltaHomeKnockoutPoints, 10) : 0 +
                    p.deltaAwayKnockoutPoints ? parseInt(p.deltaAwayKnockoutPoints, 10) : 0 +
                    p.deltaWinnerKnockoutPoints ? parseInt(p.deltaWinnerKnockoutPoints, 10) : 0,
                deltaPoulePoints: p.deltaPoulePoints ? parseInt(p.deltaPoulePoints, 10):0,
            }
        }).map(pp => {
            return { 
            ...pp, 
            totalPoints: pp.matchPoints + pp.poulePoints + pp.knockoutPoints
        }
        }));
        // let currentTable = this.getSortedPositionStand(await this.createStandTillMatchId(participantsMerged, maxMatchId.ordering))

        // if (previousTable && previousTable.length > 0) {
            // currentTable = currentTable.map(t => {
        //         this.logger.log(previousTable.find(pt => pt.id === t.id).displayName)
        //         this.logger.log(previousTable.find(pt => pt.id === t.id).matchPosition)
        //         this.logger.log(t.matchPosition)
        //         return {
        //             ...t,
        //             deltaPosition: previousTable.find(pt => pt.id === t.id).position - t.position,
        //             deltaMatchPosition: previousTable.find(pt => pt.id === t.id).matchPosition - t.matchPosition,
        //             deltatotalPoints: t.totalPoints - previousTable.find(pt => pt.id === t.id).totalPoints,
        //             deltePoulePoints: t.poulePoints - previousTable.find(pt => pt.id === t.id).poulePoints,
        //             deltaKnockoutPoints: t.knockoutPoints - previousTable.find(pt => pt.id === t.id).knockoutPoints,
        //             deltaMatchPoints: t.matchPoints - previousTable.find(pt => pt.id === t.id).matchPoints
        //         }
        //     })
        // // }

        // const docRef = db.ref(`${maxMatchId.ordering}`);
        // docRef.set(currentTable);

        await this.hetEKSPELRepo
            .save({ ...hetEkspel, currentTable: maxMatchId.ordering })

        return currentTable;
    }


    createStandTillMatchId(participants: any[]) {
        return participants
            .map(participant => {
                return {
                    ...participant,
                    totalPoints: participant.matchPoints + participant.poulePoints + participant.knockoutPoints,
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

    getKOPoints(round) {
        switch (round) {
            case '16':
                return 20
            case '8':
                return 35
            case '4':
                return 60
            case '2':
                return 100
            default:
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
