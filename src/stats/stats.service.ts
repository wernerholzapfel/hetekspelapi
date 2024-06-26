import { Injectable, Logger } from '@nestjs/common';
import { Repository } from "typeorm";
import { Match } from "../match/match.entity";
import { Team } from "../team/team.entity";
import { KnockoutPrediction } from "../knockout-prediction/knockout-prediction.entity";
import * as admin from "firebase-admin";
import { Participant } from "../participant/participant.entity";
import { InjectRepository } from '@nestjs/typeorm';
import { Knockout } from '../knockout/knockout.entity';

@Injectable()
export class StatsService {

    private readonly logger = new Logger('StatsService', { timestamp: true });

    constructor(@InjectRepository(Match)
    private readonly matchRepo: Repository<Match>,
        @InjectRepository(Team)
        private readonly teamRepo: Repository<Team>,
        @InjectRepository(KnockoutPrediction)
        private readonly knockoutPredictionRepo: Repository<KnockoutPrediction>,
        @InjectRepository(Participant)
        private readonly participantRepo: Repository<Participant>) {
    }

    async createTotoStats(): Promise<any[]> {
        let matches: any[] = await this.matchRepo
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.matchPredictions', 'matchPredictions')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .orderBy('match.ordering')
            .getMany()

        matches = matches.map(m => {
            return {
                ...m,
                matchPredictions: m.matchPredictions.map(mp => {
                    return {
                        ...mp,
                        toto: mp.homeScore > mp.awayScore ? 1 : mp.homeScore < mp.awayScore ? 2 : 3
                    }
                })
            }
        })
        matches = matches.map(m => {
            return {
                ...m,
                toto1: m.matchPredictions.filter(mp => mp.toto === 1).length,
                toto2: m.matchPredictions.filter(mp => mp.toto === 2).length,
                toto3: m.matchPredictions.filter(mp => mp.toto === 3).length,
            }
        }).map(m => {
            delete m['matchPredictions'];
            return m;
        })

        const db = admin.database();

        const docRef = db.ref(`ek2024/stats/toto`);
        docRef.set(matches);

        return matches;
    }

    // deprecated  
    async getFormInformation(): Promise<any> {
        return this.participantRepo
            .createQueryBuilder('participant')
            .leftJoin('participant.matchPredictions', 'matchPredictions')
            .leftJoin('participant.poulePredictions', 'poulePredictions')
            .leftJoin('participant.knockoutPredictions', 'knockoutPredictions')
            .select('participant.displayName')
            .addSelect('COUNT(DISTINCT(matchPredictions.id)) as matchPredictions')
            .addSelect('COUNT(DISTINCT(poulePredictions.id)) as poulePredictions')
            .addSelect('COUNT(DISTINCT(knockoutPredictions.id)) as knockoutPredictions')
            .where('participant.isAllowed')
            .groupBy('participant.id')
            .orderBy('participant.createdDate', "ASC")
            .getRawMany()
    }
    
    async getParticipantsFormInformation(): Promise<any> {
         return this.participantRepo
            .createQueryBuilder('participant')
            .loadRelationCountAndMap('participant.matchpredictions', 'participant.matchPredictions')
            .loadRelationCountAndMap('participant.poulepredictions', 'participant.poulePredictions')
            .loadRelationCountAndMap('participant.knockoutpredictions', 'participant.knockoutPredictions')
            .select('participant.displayName')
            .where('participant.isAllowed')
            .groupBy('participant.id')
            .orderBy('participant.createdDate', "ASC")
            .getMany()

    }

    async createKnockoutStats(): Promise<any> {
        const teams: any[] = await this.teamRepo.createQueryBuilder('team')
            .getMany()

        const knockoutPredictions = await this.knockoutPredictionRepo
            .createQueryBuilder('kp')
            .leftJoinAndSelect('kp.homeTeam', 'homeTeam')
            .leftJoinAndSelect('kp.awayTeam', 'awayTeam')
            .leftJoinAndSelect('kp.selectedTeam', 'selectedTeam')
            .leftJoinAndSelect('kp.knockout', 'knockout')
            .getMany()

        const knockoutStats = [
            {
                round: '16',
                teams: teams.map(team => {
                    return {
                        ...team,
                        count: this.getNumberOfPredictedForRound(knockoutPredictions, team, '16')
                    }
                }).sort((a, b) => b.count - a.count)
            }, {
                round: '8',
                teams: teams.map(team => {
                    return {
                        ...team,
                        count: this.getNumberOfPredictedForRound(knockoutPredictions, team, '8')
                    }
                }).sort((a, b) => b.count - a.count)
            }, {
                round: '4',
                teams: teams.map(team => {
                    return {
                        ...team,
                        count: this.getNumberOfPredictedForRound(knockoutPredictions, team, '4')
                    }
                }).sort((a, b) => b.count - a.count)
            }
            // , {
            //     round: '3',
            //     teams: teams.map(team => {
            //         return {
            //             ...team,
            //             count: this.getNumberOfSelectedForRound(knockoutPredictions, team, '3')
            //         }
            //     }).sort((a, b) => b.count - a.count)
            // }
            , {
                round: '2',
                teams: teams.map(team => {
                    return {
                        ...team,
                        count: this.getNumberOfPredictedForRound(knockoutPredictions, team, '2')
                    }
                }).sort((a, b) => b.count - a.count)
            }, {
                round: '1',
                teams: teams.map(team => {
                    return {
                        ...team,
                        count: this.getNumberOfSelectedForRound(knockoutPredictions, team, '2')
                    }
                }).sort((a, b) => b.count - a.count)
            }
        ]

        const db = admin.database();

        const docRef = db.ref(`ek2024/stats/knockout`);
        docRef.set(knockoutStats);
        return knockoutStats
    }

    getNumberOfPredictedForRound(knockoutPredictions, team, round) {
        return knockoutPredictions.filter(kp =>
            kp.knockout.round === round && (kp.homeTeam.id === team.id || kp.awayTeam.id === team.id)).length
    }

    getNumberOfSelectedForRound(knockoutPredictions, team, round) {
        return knockoutPredictions.filter(kp =>
            kp.knockout.round === round && kp.selectedTeam.id === team.id).length
    }

}
