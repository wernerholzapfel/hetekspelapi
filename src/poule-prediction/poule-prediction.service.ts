import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Participant } from '../participant/participant.entity';
import { PoulePrediction } from './poule-prediction.entity';
import { CreatePoulePredictionDto } from './create-poule-prediction.dto';
import { MatchPrediction } from "../match-prediction/match-prediction.entity";
import { Team } from "../team/team.entity";
import { MatchPredictionService } from "../match-prediction/match-prediction.service";
import { Match } from "../match/match.entity";
import { KnockoutPrediction } from '../knockout-prediction/knockout-prediction.entity';
import { KnockoutPredictionService } from '../knockout-prediction/knockout-prediction.service';
import { KnockoutService } from '../knockout/knockout.service';

@Injectable()
export class PoulePredictionService {
    private readonly logger = new Logger('PoulePredictionService', { timestamp: true });

    constructor(@InjectRepository(PoulePrediction)
    private readonly poulePredictionRepo: Repository<PoulePrediction>,
        @InjectRepository(Participant)
        private readonly participantRepo: Repository<Participant>,
        @InjectRepository(KnockoutPrediction)
        private readonly knockoutPredictionRepo: Repository<KnockoutPrediction>,
        private matchPredictionService: MatchPredictionService,
        private knockoutService: KnockoutService,
        private knockoutPredictionService: KnockoutPredictionService) {

    }


    async getStandBasedOnPredictionsForLoggedInUser(firebaseIdentifier: string, poule: string) {
        const matchPredictions = await this.matchPredictionService.findMatchesForLoggedInUser(firebaseIdentifier);
        const standBasedOnMatches = [...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === poule), true),
        ]

        return standBasedOnMatches
    }

    async findPoulePredictionsForLoggedInUser(firebaseIdentifier: string): Promise<PoulePrediction[]> {
        const poulePredictions = await this.poulePredictionRepo
            .createQueryBuilder('pouleprediction')
            .leftJoinAndSelect('pouleprediction.team', 'team')
            .leftJoin('pouleprediction.participant', 'participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', { firebaseIdentifier })
            .getMany();


        const matchPredictions = await this.matchPredictionService.findMatchesForLoggedInUser(firebaseIdentifier);
        const poulesBasedOnMatches = [
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'A'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'B'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'C'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'D'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'E'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'F'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'G'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'H'), true),
        ]

        const thirdpositions = poulesBasedOnMatches.filter(pp => pp.positie === 3)
            .sort((a, b) => b.thirdPositionScore - a.thirdPositionScore)

        let poulePredictionSelected = poulesBasedOnMatches.map(pp => {
            return {
                ...pp,
                selected: pp.positie < 3 ? true : pp.positie === 4 ? false : !!thirdpositions.find((tp, index) => tp.team.id.includes(pp.team.id) && index < 4)
            }
        })

        return poulePredictionSelected.map(line => {
            const poulePrediction = poulePredictions.find(pp => pp.team.id === line.team.id)

            if (poulePrediction) {
                return {
                    ...line,
                    id: poulePrediction.id,
                    spelpunten: poulePrediction.spelpunten,
                    positie: poulePrediction.positie,
                    selected: poulePrediction.selected
                }
            } else {
                delete line['id'];
                return line;
            }
        })
    }

    async findPoulePredictionsForParticipant(participantId: string): Promise<PoulePrediction[]> {
        const poulePredictions = await this.poulePredictionRepo
            .createQueryBuilder('pouleprediction')
            .leftJoinAndSelect('pouleprediction.team', 'team')
            .leftJoin('pouleprediction.participant', 'participant')
            .where('participant.id = :participantId', { participantId })
            .getMany();

        return poulePredictions
    }

    async findWerkelijkePouleResults(): Promise<PoulePrediction[]> {

        const matches = await this.matchPredictionService.findMatches();
        const poulesBasedOnMatches = [...this.berekenWerkelijkeStand(matches.filter(mp => mp.poule === 'A'), true),
        ...this.berekenWerkelijkeStand(matches.filter(mp => mp.poule === 'B'), true),
        ...this.berekenWerkelijkeStand(matches.filter(mp => mp.poule === 'C'), true),
        ...this.berekenWerkelijkeStand(matches.filter(mp => mp.poule === 'D'), true),
        ...this.berekenWerkelijkeStand(matches.filter(mp => mp.poule === 'E'), true),
        ...this.berekenWerkelijkeStand(matches.filter(mp => mp.poule === 'F'), true),
        ...this.berekenWerkelijkeStand(matches.filter(mp => mp.poule === 'G'), true),
        ...this.berekenWerkelijkeStand(matches.filter(mp => mp.poule === 'H'), true),
        ]
        return poulesBasedOnMatches
    }

    async createPoulePrediction(items: CreatePoulePredictionDto[], firebaseIdentifier): Promise<KnockoutPrediction[]> {

        const participant = await this.participantRepo
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', { firebaseIdentifier })
            .getOne();

        const ppSaved = await this.poulePredictionRepo.save(items.map(pp => {
            if (!pp.team) {
                console.log(pp)
            }
            return {
                ...pp,
                team: { id: pp.team.id },
                participant
            }
        }))
            .catch((err) => {
                throw new HttpException({
                    message: err.message,
                    statusCode: HttpStatus.BAD_REQUEST,
                }, HttpStatus.BAD_REQUEST);
            });

        const knockoutSchema = await this.knockoutService.findKnockouts(firebaseIdentifier)

        // get nummer dries
        // bepaal poule van nummer dries en zet op volgorde.
         const poules =   await this.findPoulePredictionsForLoggedInUser(firebaseIdentifier)
         const nummerDries = poules.filter(item => item.positie === 3 && item.selected)

         const nummerDrieIdentifier = nummerDries.sort((a, b) => {
            if (b.poule > a.poule) {
                return -1;
            }
            if (a.poule > b.poule) {
                return 1;
            }
            return 0;
        }).reduce((acc: string, val) => acc + val.poule, '');

        const thirdplaces = this.getPositionForThirdPlacedTeams(nummerDrieIdentifier);

        const speelschema = knockoutSchema.filter(ks => ks.round === '16').map(match => {
            switch (match.awayId) {
                case 'WB':
                    match.awayId = thirdplaces.WB;
                    break;
                case 'WC':
                    match.awayId = thirdplaces.WC;
                    break;
                case 'WE':
                    match.awayId = thirdplaces.WE;
                    break;
                case 'WF':
                    match.awayId = thirdplaces.WF;
                    break;
                default:
                // code block
            }
            return {
                ...match,
                homeTeam: this.setTeam(knockoutSchema, match.homeId, match.round, poules, null),
                awayTeam: this.setTeam(knockoutSchema, match.awayId, match.round, poules, null)
            };
        });
        const knockoutPredictions = await this.knockoutPredictionService.findKnockoutForParticipant(participant.id)

        const kpSaved = await this.knockoutPredictionRepo.save(knockoutPredictions.map(kp => {
            const knockoutMatch = speelschema.find(ks => ks.id === kp.knockout.id);
            this.logger.log(knockoutMatch)
                return {
                ...kp,
                homeTeam: { id: knockoutMatch.homeTeam.id },
                awayTeam: { id: knockoutMatch.awayTeam.id },
                selectedTeam: { id: kp.selectedTeam && kp.selectedTeam.id === knockoutMatch.homeTeam.id || kp.selectedTeam && kp.selectedTeam.id === knockoutMatch.awayTeam.id ? kp.selectedTeam.id : null }
            }
        }))
            .catch((err) => {
                throw new HttpException({
                    message: err.message,
                    statusCode: HttpStatus.BAD_REQUEST,
                }, HttpStatus.BAD_REQUEST);
            });

        return knockoutPredictions;

        // check of er knockoutpredictions zijn van round 16
        // update knockoutpredictions indien home of awayteam anders is.

    }

    private setTeam(speelschema, id, round, poules, selectedTeam: string): Team {
        if (round === '16') {
            return poules.find(p => id === `${p.positie}${p.poule}`) ? poules.find(p => id === `${p.positie}${p.poule}`).team : '';
        }
        //  else if (round === '3') {
        //     // uitzondering voor Verliezer
        //     const matchLoser = speelschema.find(sp => sp.matchId === id.substring(1));
        //     const team = this.getLoserTeam(matchLoser, selectedTeam, id)
        //     return team;
        // } else {
        //     const matchWinner = speelschema.find(sp => sp.matchId === id);
        //     const team = this.getWinnerTeam(matchWinner, selectedTeam, id)
        //     return team;
        // }
    }
    private getPositionForThirdPlacedTeams(nummerDrieIdentifier: string): { identifier: string, WB: string, WC: string, WE: string, WF: string } {
        return [
            {
                identifier: 'ABCD',
                WB: '3A',
                WC: '3D',
                WE: '3B',
                WF: '3C'
            }, {
                identifier: 'ABCE',
                WB: '3A',
                WC: '3E',
                WE: '3B',
                WF: '3C'
            }, {
                identifier: 'ABCF',
                WB: '3A',
                WC: '3F',
                WE: '3B',
                WF: '3C'
            }, {
                identifier: 'ABDE',
                WB: '3D',
                WC: '3E',
                WE: '3A',
                WF: '3B'
            }, {
                identifier: 'ABDF',
                WB: '3D',
                WC: '3F',
                WE: '3A',
                WF: '3B'
            }, {
                identifier: 'ABEF',
                WB: '3E',
                WC: '3F',
                WE: '3B',
                WF: '3A'
            }, {
                identifier: 'ACDE',
                WB: '3E',
                WC: '3D',
                WE: '3C',
                WF: '3A'
            }, {
                identifier: 'ACDF',
                WB: '3F',
                WC: '3D',
                WE: '3C',
                WF: '3A'
            }, {
                identifier: 'ACEF',
                WB: '3E',
                WC: '3F',
                WE: '3C',
                WF: '3A'
            }, {
                identifier: 'ADEF',
                WB: '3E',
                WC: '3F',
                WE: '3D',
                WF: '3A'
            }, {
                identifier: 'BCDE',
                WB: '3E',
                WC: '3D',
                WE: '3B',
                WF: '3C'
            }, {
                identifier: 'BCDF',
                WB: '3F',
                WC: '3D',
                WE: '3C',
                WF: '3B'
            }, {
                identifier: 'BCEF',
                WB: '3F',
                WC: '3E',
                WE: '3C',
                WF: '3B'
            }, {
                identifier: 'BDEF',
                WB: '3F',
                WC: '3E',
                WE: '3D',
                WF: '3B'
            }, {
                identifier: 'CDEF',
                WB: '3F',
                WC: '3E',
                WE: '3D',
                WF: '3C'
            }
        ].find(p => p.identifier === nummerDrieIdentifier);
    }

    private berekenWerkelijkeStand(matches: Match[], sortTable: boolean): PoulePrediction[] {
        let table: PoulePrediction[] = [];

        for (const match of matches) {
            const index = table.findIndex(t => t.team.id === match.homeTeam.id);

            if (index === -1) {
                table.push(this.createInitialTableLine(match.homeTeam, match.poule));
            }
        }

        for (const match of matches) {
            const index = table.findIndex(t => t.team.id === match.awayTeam.id);

            if (index === -1) {
                table.push(this.createInitialTableLine(match.awayTeam, match.poule));
            }
        }

        for (const match of matches) {
            table = this.updateWerkelijkeTableLine(table, match);
        }

        if (sortTable) {
            table = table.map(line => {
                return {
                    ...line,
                    thirdPositionScore: this.calculateScoreForThirdPosition(line),
                    sortering: this.calculateWerkelijkeSortering(line, matches, table)
                };
            })
                .sort((a, b) =>
                    (b.sortering - a.sortering))
                .reduce((accumulator, currentValue, index) => {
                    return [...accumulator, Object.assign({}, currentValue, {
                        positie: this.calculatePosition(currentValue, index, accumulator)
                    })];
                }, []);
        }
        return table;
    }


    private berekenStand(matchPredictions: MatchPrediction[], sortTable: boolean): PoulePrediction[] {
        let table: PoulePrediction[] = [];

        for (const match of matchPredictions) {
            const index = table.findIndex(t => t.team.id === match.match.homeTeam.id);

            if (index === -1) {
                table.push(this.createInitialTableLine(match.match.homeTeam, match.match.poule));
            }
        }

        for (const match of matchPredictions) {
            const index = table.findIndex(t => t.team.id === match.match.awayTeam.id);

            if (index === -1) {
                table.push(this.createInitialTableLine(match.match.awayTeam, match.match.poule));
            }
        }

        for (const match of matchPredictions) {
            table = this.updateTableLine(table, match);
        }

        if (sortTable) {
            table = table.map(line => {
                return {
                    ...line,
                    thirdPositionScore: this.calculateScoreForThirdPosition(line),
                    sortering: this.calculateSortering(line, matchPredictions, table)
                };
            })
                .sort((a, b) =>
                    (b.sortering - a.sortering))
                .reduce((accumulator, currentValue, index) => {
                    return [...accumulator, Object.assign({}, currentValue, {
                        positie: this.calculatePosition(currentValue, index, accumulator)
                    })];
                }, []);
        }
        return table;
    }

    calculatePosition(tableLine: PoulePrediction, index, table: PoulePrediction[]) {
        return index + 1;
        // return index > 0 && tableLine.sortering === table[index - 1].sortering ?
        //     table[index - 1].positie : index + 1;
    }

    calculateSortering(tableLine: PoulePrediction, matches: MatchPrediction[], table: PoulePrediction[]) {
        const teamsEqualOnPoints = table.filter(line => line.punten === tableLine.punten).map(line => {
            return line.team.id;
        });

        if (teamsEqualOnPoints.length > 1) {
            const matchesForTeam = matches.filter(match => {
                return teamsEqualOnPoints.includes(match.match.homeTeam.id) && (teamsEqualOnPoints.includes(match.match.awayTeam.id));
            });
            const tableWithTeamsEqualOnPoints: PoulePrediction[] = this.berekenStand(matchesForTeam, false);
            const tableLineWithTeamEqualOnPoints: PoulePrediction = tableWithTeamsEqualOnPoints.find(line => line.team.id === tableLine.team.id);
            // console.log(tableWithTeamsEqualOnPoints);
            return (tableLine.punten * 10000000 +
                tableLineWithTeamEqualOnPoints.punten * 100000 +
                ((tableLineWithTeamEqualOnPoints.goalsFor - tableLineWithTeamEqualOnPoints.goalsAgainst) * 100) +
                tableLineWithTeamEqualOnPoints.goalsFor +
                ((tableLine.goalsFor - tableLine.goalsAgainst) / 100) +
                tableLine.goalsFor / 10000);
        } else {
            return (tableLine.punten * 10000000 +
                ((tableLine.goalsFor - tableLine.goalsAgainst) * 100) +
                tableLine.goalsFor);

        }
        // a. higher number of points obtained in the matches played among the teams in
        // question;
        // b. superior goal difference resulting from the matches played among the teams
        // in question;
        // c. higher number of goals scored in the matches played among the teams in
        // question;
        // d. if, after having applied criteria a) to c), teams still have an equal ranking,
        // criteria a) to c) are reapplied exclusively to the matches between the
        // remaining teams to determine their final rankings. If this procedure does not
        // lead to a decision, criteria e) to i) apply in the order given to the two or more
        // teams still equal:
        // e. superior goal difference in all group matches;
        // f. higher number of goals scored in all group mat

    }

    calculateWerkelijkeSortering(tableLine: PoulePrediction, matches: Match[], table: PoulePrediction[]) {
        const teamsEqualOnPoints = table.filter(line => line.punten === tableLine.punten).map(line => {
            return line.team.id;
        });

        if (teamsEqualOnPoints.length > 1) {
            const matchesForTeam = matches.filter(match => {
                return teamsEqualOnPoints.includes(match.homeTeam.id) && (teamsEqualOnPoints.includes(match.awayTeam.id));
            });
            const tableWithTeamsEqualOnPoints: PoulePrediction[] = this.berekenWerkelijkeStand(matchesForTeam, false);
            const tableLineWithTeamEqualOnPoints: PoulePrediction = tableWithTeamsEqualOnPoints.find(line => line.team.id === tableLine.team.id);

            return (tableLine.punten * 10000000 +
                tableLineWithTeamEqualOnPoints.punten * 100000 +
                ((tableLineWithTeamEqualOnPoints.goalsFor - tableLineWithTeamEqualOnPoints.goalsAgainst) * 100) +
                tableLineWithTeamEqualOnPoints.goalsFor +
                ((tableLine.goalsFor - tableLine.goalsAgainst) / 100) +
                tableLine.goalsFor / 10000);
        } else {
            return (tableLine.punten * 10000000 +
                ((tableLine.goalsFor - tableLine.goalsAgainst) * 100) +
                tableLine.goalsFor);

        }
        // a. higher number of points obtained in the matches played among the teams in
        // question;
        // b. superior goal difference resulting from the matches played among the teams
        // in question;
        // c. higher number of goals scored in the matches played among the teams in
        // question;
        // d. if, after having applied criteria a) to c), teams still have an equal ranking,
        // criteria a) to c) are reapplied exclusively to the matches between the
        // remaining teams to determine their final rankings. If this procedure does not
        // lead to a decision, criteria e) to i) apply in the order given to the two or more
        // teams still equal:
        // e. superior goal difference in all group matches;
        // f. higher number of goals scored in all group mat

    }


    // a. higher number of points;
    // b. superior goal difference;
    // c. higher number of goals scored;
    // d. higher number of wins;
    calculateScoreForThirdPosition(tableLine: PoulePrediction) {
        return (tableLine.punten * 1000000 +
            ((tableLine.goalsFor - tableLine.goalsAgainst) * 10000) +
            tableLine.goalsFor * 100 +
            tableLine.winst);
    }

    createInitialTableLine(team: Team, poule: string): any {
        return {
            poule,
            team,
            positie: 0,
            gespeeld: 0,
            winst: 0,
            punten: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            sortering: 0
        };
    }

    private updateTableLine(table: PoulePrediction[], matchPrediction: MatchPrediction): PoulePrediction[] {
        return table.map(line => {
            if (line.team.id === matchPrediction.match.homeTeam.id) {
                return this.updateTeamLine(line, matchPrediction, true);
            } else if (line.team.id === matchPrediction.match.awayTeam.id) {
                return this.updateTeamLine(line, matchPrediction, false);
            } else {
                return { ...line };
            }
        });

    }

    private updateWerkelijkeTableLine(table: PoulePrediction[], match: Match): PoulePrediction[] {
        return table.map(line => {
            if (line.team.id === match.homeTeam.id) {
                return this.updateWerkelijkeTeamLine(line, match, true);
            } else if (line.team.id === match.awayTeam.id) {
                return this.updateWerkelijkeTeamLine(line, match, false);
            } else {
                return { ...line };
            }
        });

    }

    updateWerkelijkeTeamLine(line: PoulePrediction, match: Match, homeTeam: boolean) {
        return match.homeScore === undefined || match.awayScore === undefined ||
            match.homeScore === null || match.awayScore === null ?
            { ...line } :
            {
                ...line,
                gespeeld: line.gespeeld + 1,
                winst: (this.punten(homeTeam ?
                    match.homeScore : match.awayScore, homeTeam ?
                    match.awayScore : match.homeScore) === 3) ? line.winst + 1 : line.winst,
                punten: line.punten +
                    this.punten(homeTeam ?
                        match.homeScore : match.awayScore, homeTeam ?
                        match.awayScore : match.homeScore),
                goalsFor: line.goalsFor + (homeTeam ? match.homeScore : match.awayScore),
                goalsAgainst: line.goalsAgainst + (homeTeam ? match.awayScore : match.homeScore)
            };
    }

    updateTeamLine(line: PoulePrediction, matchPrediction: MatchPrediction, homeTeam: boolean) {
        return matchPrediction.homeScore === undefined || matchPrediction.awayScore === undefined ||
            matchPrediction.homeScore === null || matchPrediction.awayScore === null ?
            { ...line } :
            {
                ...line,
                gespeeld: line.gespeeld + 1,
                winst: (this.punten(homeTeam ?
                    matchPrediction.homeScore : matchPrediction.awayScore, homeTeam ?
                    matchPrediction.awayScore : matchPrediction.homeScore) === 3) ? line.winst + 1 : line.winst,
                punten: line.punten +
                    this.punten(homeTeam ?
                        matchPrediction.homeScore : matchPrediction.awayScore, homeTeam ?
                        matchPrediction.awayScore : matchPrediction.homeScore),
                goalsFor: line.goalsFor + (homeTeam ? matchPrediction.homeScore : matchPrediction.awayScore),
                goalsAgainst: line.goalsAgainst + (homeTeam ? matchPrediction.awayScore : matchPrediction.homeScore)
            };
    }

    private punten(gescoord: number, tegen: number): number {
        return gescoord === null || tegen === null ?
            0 : gescoord > tegen ?
                3 : gescoord < tegen ?
                    0 : 1;
    }

}
