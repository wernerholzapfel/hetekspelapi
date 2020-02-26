import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Connection, getManager, Repository} from 'typeorm';
import {Match} from './match.entity';
import {CreateMatchDto} from './create-match.dto';
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
            .getMany();
    }

    async create(item: CreateMatchDto): Promise<Match> {
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
                    .leftJoinAndSelect('match.round', 'round')
                    .where('match.id = :matchId', {matchId: item.id})
                    .getMany();

                const updatedMatchPredictions: any[] = [...matchPredictions.map(prediction => {
                    return {
                        ...prediction,
                        punten: this.determineMatchPoints(prediction),
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
        if (isNaN(matchPrediction.homeScore) && isNaN(matchPrediction.awayScore) && isNaN(matchPrediction.match.homeScore) && isNaN(matchPrediction.match.awayScore)) {
            return null;
        }
        if (matchPrediction.homeScore === matchPrediction.match.homeScore && matchPrediction.awayScore === matchPrediction.match.awayScore) {
            return 10;
        }
        if (matchPrediction.homeScore - matchPrediction.awayScore === matchPrediction.match.homeScore - matchPrediction.match.awayScore
            || (matchPrediction.homeScore > matchPrediction.awayScore && matchPrediction.match.homeScore > matchPrediction.match.awayScore)
            || (matchPrediction.homeScore < matchPrediction.awayScore && matchPrediction.match.homeScore < matchPrediction.match.awayScore)) {
            return 3;
        } else {
            return 0
        }
    }
}
