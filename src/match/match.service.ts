import {HttpException, HttpStatus, Injectable, Logger} from '@nestjs/common';
import {DataSource, Repository, UpdateResult} from 'typeorm';
import {Match} from './match.entity';
import {UpdateMatchDto} from './update-match.dto';
import {MatchPrediction} from '../match-prediction/match-prediction.entity';
import {InjectRepository} from '@nestjs/typeorm';
import { match } from 'assert';
import e = require('express');

@Injectable()
export class MatchService {
    constructor(@InjectRepository(Match)
                private readonly matchRepo: Repository<Match>,
                private dataSource: DataSource)
                 {
    }
    private readonly logger = new Logger('MatchService', {timestamp: true});

    async findMatches(): Promise<Match[]> {
        return await this.matchRepo
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .orderBy('match.ordering')
            .getMany();
    }


    async getFullScore(): Promise<any[]> {

        const matches = await this.matchRepo
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .leftJoinAndSelect('match.matchPredictions', 'matchPredictions', 
            'match.homeScore = matchPredictions.homeScore and match.awayScore = matchPredictions.awayScore')
            .leftJoinAndSelect('matchPredictions.participant', 'participants')
            .where('match.homeScore is not null')
            .orderBy('match.ordering', "DESC")
            .take(3)
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
                        id: mp.participant.id,
                        displayName: mp.participant.displayName
                    }
                })
            }
        })
        // return [];
    }

    async findMatch(matchId): Promise<Match> {
        return await this.matchRepo
            .createQueryBuilder('match')
            .leftJoinAndSelect('match.homeTeam', 'homeTeam')
            .leftJoinAndSelect('match.awayTeam', 'awayTeam')
            .leftJoinAndSelect('match.matchPredictions', 'matchPredictions')
            .leftJoinAndSelect('matchPredictions.participant', 'participant')
            .where('match.id = :matchId', {matchId})
            .getOne();
    }

    async update(item: UpdateMatchDto): Promise<Match> {
        const queryRunner = this.dataSource.createQueryRunner();
        let savedMatch;
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            savedMatch = await queryRunner.manager.getRepository(Match)
            .createQueryBuilder('match')
                .update()
                .set(item)
                .where('match.id = :matchId', { matchId: item.id })
                .returning('*')
                .execute()
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });

            if (item.id) {
                const matchPredictions: MatchPrediction[] = await queryRunner.manager
                    .getRepository(MatchPrediction).createQueryBuilder('matchPrediction')
                    .leftJoinAndSelect('matchPrediction.match', 'match')
                    .where('match.id = :matchId', { matchId: item.id })
                    .getMany();

                const updatedMatchPredictions: any[] = [...matchPredictions.map(prediction => {
                    return {
                        ...prediction,
                        spelpunten: this.determineMatchPoints(prediction),
                        tableId: savedMatch.raw[0].ordering
                    }
                })];


                await queryRunner.manager
                    .getRepository(MatchPrediction)
                    .save(updatedMatchPredictions)
                    .catch((err) => {
                        throw new HttpException({
                            message: err.message,
                            statusCode: HttpStatus.BAD_REQUEST,
                        }, HttpStatus.BAD_REQUEST);
                    });


            }

            await queryRunner.commitTransaction();
        } catch (err) {
            this.logger.log(err);
            // since we have errors lets rollback the changes we made
            await queryRunner.rollbackTransaction();
        } finally {
            // you need to release a queryRunner which was manually instantiated
            await queryRunner.release();
            return savedMatch
        }
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
            if (matchPrediction.homeScore === matchPrediction.match.homeScore || matchPrediction.awayScore === matchPrediction.match.awayScore) {
                // toto goed + score goed
                return 25;
            } else {
                return 20

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
