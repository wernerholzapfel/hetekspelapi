import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {MatchPrediction} from './match-prediction.entity';
import {CreateMatchPredictionDto} from './create-match-prediction.dto';
import {Connection, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Participant} from '../participant/participant.entity';
import {Match} from '../match/match.entity';

@Injectable()
export class MatchPredictionService {

    constructor(private connection: Connection,
                @InjectRepository(MatchPrediction)
                private readonly matchPrediction: Repository<MatchPrediction>) {

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

    async createMatchPrediction(item: CreateMatchPredictionDto, firebaseIdentifier): Promise<MatchPrediction>{

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
