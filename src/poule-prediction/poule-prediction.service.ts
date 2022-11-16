import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Participant} from '../participant/participant.entity';
import {PoulePrediction} from './poule-prediction.entity';
import {CreatePoulePredictionDto} from './create-poule-prediction.dto';
import {MatchPrediction} from "../match-prediction/match-prediction.entity";
import {Team} from "../team/team.entity";
import {MatchPredictionService} from "../match-prediction/match-prediction.service";
import {Match} from "../match/match.entity";

@Injectable()
export class PoulePredictionService {

    constructor(@InjectRepository(PoulePrediction)
                private readonly poulePredictionRepo: Repository<PoulePrediction>,
                @InjectRepository(Participant)
                private readonly participantRepo: Repository<Participant>,
                private matchPredictionService: MatchPredictionService) {

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
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getMany();


        const matchPredictions = await this.matchPredictionService.findMatchesForLoggedInUser(firebaseIdentifier);
        const poulesBasedOnMatches = [...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'A'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'B'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'C'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'D'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'E'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'F'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'G'), true),
            ...this.berekenStand(matchPredictions.filter(mp => mp.match.poule === 'H'), true),
        ]

        return poulesBasedOnMatches.map(line => {
            const poulePrediction = poulePredictions.find(pp => pp.team.id === line.team.id)

            if (poulePrediction) {

                return {
                    ...line,
                    id: poulePrediction.id,
                    spelpunten: poulePrediction.spelpunten,
                    positie: poulePrediction.positie
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
            .where('participant.id = :participantId', {participantId})
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

    async createPoulePrediction(items: CreatePoulePredictionDto[], firebaseIdentifier): Promise<PoulePrediction[]> {

        const participant = await this.participantRepo
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();

        return await this.poulePredictionRepo.save(items.map(pp => {
            if (!pp.team) {
                console.log(pp)
            }
            return {
                ...pp,
                team: {id: pp.team.id},
                participant
            }
        }))
            .catch((err) => {
                throw new HttpException({
                    message: err.message,
                    statusCode: HttpStatus.BAD_REQUEST,
                }, HttpStatus.BAD_REQUEST);
            });
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
                return {...line};
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
                return {...line};
            }
        });

    }

    updateWerkelijkeTeamLine(line: PoulePrediction, match: Match, homeTeam: boolean) {
        return match.homeScore === undefined || match.awayScore === undefined ||
        match.homeScore === null || match.awayScore === null ?
            {...line} :
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
            {...line} :
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
