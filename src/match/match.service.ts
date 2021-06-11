import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Connection, getManager, Repository} from 'typeorm';
import {Match} from './match.entity';
import {UpdateMatchDto} from './update-match.dto';
import {MatchPrediction} from '../match-prediction/match-prediction.entity';
import {InjectRepository} from '@nestjs/typeorm';

@Injectable()
export class MatchService {
    constructor(private readonly connection: Connection,
                @InjectRepository(Match)
                private readonly matchRepo: Repository<Match>) {
    }

    async findMatches(): Promise<Match[]> {
        return await this.connection.getRepository(Match)
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .orderBy('match.ordering')
            .getMany();
    }


    async getFullScore(): Promise<any[]> {
        const matches = await this.connection.getRepository(Match)
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .leftJoinAndSelect('match.matchPredictions', 'matchPredictions', 'match.homeScore = matchPredictions.homeScore and match.awayScore = matchPredictions.awayScore')
            .leftJoinAndSelect('matchPredictions.participant', 'participants')
            .where('match.homeScore is not null')
            .orderBy('match.ordering', "DESC")
            .limit(3)
            .getMany();

        return matches.map(match => {
            return {
                id: match.id,
                homeTeam: match.homeTeam,
                awayTeam: match.awayTeam,
                ordering: match.ordering,
                poule: match.poule,
                city: match.city,
                homeScore: match.homeScore,
                awayScore: match.awayScore,
                date: match.date,
                updatedDate: match.updatedDate,
                createdDate: match.createdDate,
                participants: match.matchPredictions.map(mp => {
                    return {
                        displayName: mp.participant.displayName
                    }
                })
            }
        })
    }

    async findMatch(matchId): Promise<Match> {
        return await this.connection.getRepository(Match)
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .leftJoinAndSelect('match.matchPredictions', 'matchPredictions')
            .leftJoinAndSelect('matchPredictions.participant', 'participant')
            .where('match.id = :matchId', {matchId})
            .getOne();
    }

    async update(item: UpdateMatchDto): Promise<Match> {
        return await getManager().transaction(async transactionalEntityManager => {

            // opslaan match in database
            const savedMatch = await this.matchRepo.save(item)
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });

            if (item.id) {
                const matchPredictions: MatchPrediction[] = await transactionalEntityManager
                    .getRepository(MatchPrediction).createQueryBuilder('matchPrediction')
                    .leftJoinAndSelect('matchPrediction.match', 'match')
                    .where('match.id = :matchId', {matchId: item.id})
                    .getMany();

                const updatedMatchPredictions: any[] = [...matchPredictions.map(prediction => {
                    return {
                        ...prediction,
                        spelpunten: this.determineMatchPoints(prediction),
                    }
                })];


                await transactionalEntityManager
                    .getRepository(MatchPrediction)
                    .save(updatedMatchPredictions)
                    .catch((err) => {
                        throw new HttpException({
                            message: err.message,
                            statusCode: HttpStatus.BAD_REQUEST,
                        }, HttpStatus.BAD_REQUEST);
                    });


            }

            return savedMatch
        })
    }

    determineMatchPoints(matchPrediction: MatchPrediction): number {
        // iets niet ingevuld
        if (isNaN(matchPrediction.homeScore) && isNaN(matchPrediction.awayScore) && isNaN(matchPrediction.match.homeScore) && isNaN(matchPrediction.match.awayScore)) {
            return null;
        }
        // volledig goed voorspeld
        if (matchPrediction.homeScore === matchPrediction.match.homeScore && matchPrediction.awayScore === matchPrediction.match.awayScore) {
            return 30;
        }
        // toto goed
        if (matchPrediction.homeScore - matchPrediction.awayScore === matchPrediction.match.homeScore - matchPrediction.match.awayScore
            || (matchPrediction.homeScore > matchPrediction.awayScore && matchPrediction.match.homeScore > matchPrediction.match.awayScore)
            || (matchPrediction.homeScore < matchPrediction.awayScore && matchPrediction.match.homeScore < matchPrediction.match.awayScore)) {
            // toto goed + score goed
            if (matchPrediction.homeScore === matchPrediction.match.homeScore || matchPrediction.awayScore === matchPrediction.match.awayScore) {
                return 20
            } else {
                return 15
            }
        }
        // doelpunten maker goed
        if (matchPrediction.homeScore === matchPrediction.match.homeScore || matchPrediction.awayScore === matchPrediction.match.awayScore) {
            return 5
        } else {
            return 0
        }
    }
}
