import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {MatchPrediction} from './match-prediction.entity';
import {CreateMatchPredictionDto} from './create-match-prediction.dto';
import {Connection, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Participant} from '../participant/participant.entity';
import {Match} from '../match/match.entity';
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";
import {Knockout} from "../knockout/knockout.entity";
import {StandService} from "../stand/stand.service";

@Injectable()
export class MatchPredictionService {

    constructor(private connection: Connection,
                @InjectRepository(MatchPrediction)
                private readonly matchPrediction: Repository<MatchPrediction>,
                private standService: StandService,) {

    }

    async findMatches(): Promise<Match[]> {
        const matches = await this.connection.getRepository(Match)
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .getMany();

        return matches
    }

    async findMatchesForLoggedInUser(firebaseIdentifier: string): Promise<MatchPrediction[]> {
        let combinedMatchPredictions = [];
        const matches = await this.connection.getRepository(Match)
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .getMany();

        const matchPredictions = await this.connection.getRepository(MatchPrediction)
            .createQueryBuilder('matchprediction')
            .leftJoin('matchprediction.participant', 'participant')
            .leftJoinAndSelect('matchprediction.match', 'match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .orderBy('match.ordering')
            .getMany();

        if (matchPredictions && matchPredictions.length > 0) {
            combinedMatchPredictions = [...matchPredictions,
                ...matches.filter(match => {
                    return !matchPredictions.find(mp => mp.match.id === match.id);
                })
                    .map(i => {
                        return this.transformMatchToPrediction(i);
                    })];
        } else if (!matchPredictions || matchPredictions.length === 0 && matches) {
            combinedMatchPredictions = matches.map(i => {
                return this.transformMatchToPrediction(i);
            });
        }
        return combinedMatchPredictions;
    }

    async findTodaysMatchesForLoggedInUser(firebaseIdentifier: string): Promise<{ predictionType: string, knockout: Knockout[], matchPredictions?: MatchPrediction[], knockoutPredictions?: KnockoutPrediction[] }> {

        const today = new Date(new Date().setHours(0, 0, 0, 0));
        const tomorrow = new Date(new Date().setHours(23, 59, 59, 0));
        let knockoutPredictions = []
        let knockout = []
        let round: string = null
        const matchPredictions = await this.connection.getRepository(MatchPrediction)
            .createQueryBuilder('matchprediction')
            .leftJoin('matchprediction.participant', 'participant')
            .leftJoinAndSelect('matchprediction.match', 'match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .andWhere('match.date <= :tomorrow', {tomorrow})
            .andWhere('match.date >= :today', {today})
            .orderBy('match.ordering')
            .getMany();

        if (matchPredictions.length === 0) {

            knockout = await this.connection.getRepository(Knockout).createQueryBuilder('knockout')
                .leftJoinAndSelect('knockout.homeTeam', 'homeTeam')
                .leftJoinAndSelect('knockout.awayTeam', 'awayTeam')
                .leftJoinAndSelect('knockout.winnerTeam', 'winnerTeam')
                .where('knockout.date <= :tomorrow', {tomorrow})
                .andWhere('knockout.date >= :today', {today})
                .getMany();

            round = knockout[0].round != '2' ? (parseInt(knockout[0].round) / 2).toString() : knockout[0].round

            if (knockout.length > 0) {
                const roundIds = await this.connection.getRepository(Knockout)
                    .createQueryBuilder('knockout')
                    .select('knockout.id')
                    .where('knockout.round = :round', {round})
                    .getMany()

                knockoutPredictions = await this.connection.getRepository(KnockoutPrediction)
                    .createQueryBuilder('knockoutprediction')
                    .leftJoin('knockoutprediction.participant', 'participant')
                    .leftJoinAndSelect('knockoutprediction.knockout', 'knockout')
                    .leftJoinAndSelect('knockoutprediction.selectedTeam', 'selectedTeam')
                    .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
                    .andWhere('knockout.id IN(:...round)', {round: roundIds.map(r => r.id)})
                    .orderBy('knockout.ordering')
                    .getMany();
            }
        }
        return {
            predictionType: matchPredictions.length > 0 ? 'matches' : 'knockout',
            matchPredictions: matchPredictions,
            knockout: knockout.map(ko => {
                console.log(ko);
                return {
                    ...ko,
                    homeSpelpunten: knockoutPredictions.find(kp => ko.homeTeam && kp.selectedTeam.id === ko.homeTeam.id) ? this.standService.getKOPoints(round) : null,
                    awaySpelpunten: knockoutPredictions.find(kp => ko.awayTeam && kp.selectedTeam.id === ko.awayTeam.id) ? this.standService.getKOPoints(round) : null,
                    homeTeam: {
                        ...ko.homeTeam,
                        selectedTeam: knockoutPredictions.find(kp => ko.homeTeam && kp.selectedTeam.id === ko.homeTeam.id)
                    },
                    awayTeam: {
                        ...ko.awayTeam,
                        selectedTeam: knockoutPredictions.find(kp => ko.awayTeam && kp.selectedTeam.id === ko.awayTeam.id)
                    },
                }
            }),
        }
    }

    async findMatchesForParticipant(participantId: string): Promise<MatchPrediction[]> {
        const matchPredictions = await this.connection.getRepository(MatchPrediction)
            .createQueryBuilder('matchprediction')
            .leftJoin('matchprediction.participant', 'participant')
            .leftJoinAndSelect('matchprediction.match', 'match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .where('participant.id = :participantId', {participantId})
            .orderBy('match.ordering')
            .getMany();

        return matchPredictions;
    }

    async createMatchPrediction(item: CreateMatchPredictionDto, firebaseIdentifier): Promise<MatchPrediction> {

        const participant = await this.connection.getRepository(Participant)
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();

        return this.matchPrediction.save({...item, participant})
            .catch((err) => {
                throw new HttpException({
                    message: err.message,
                    statusCode: HttpStatus.BAD_REQUEST,
                }, HttpStatus.BAD_REQUEST);
            });
    }

    transformMatchToPrediction(i): any {
        return {homeScore: null, awayScore: null, match: i};
    }

}
