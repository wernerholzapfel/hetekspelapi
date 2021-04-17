import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Brackets, Connection, Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Participant} from '../participant/participant.entity';
import {Match} from '../match/match.entity';
import {KnockoutPrediction} from "./knockout-prediction.entity";
import {CreateKnockoutPredictionDto} from "./create-knockout-prediction.dto";
import {Team} from "../team/team.entity";

@Injectable()
export class KnockoutPredictionService {

    constructor(private connection: Connection,
                @InjectRepository(KnockoutPrediction)
                private readonly knockoutPredictionRepository: Repository<KnockoutPrediction>) {

    }

    async findKnockoutForParticipant(participantId: string): Promise<KnockoutPrediction[]> {
        return await this.connection
            .getRepository(KnockoutPrediction).createQueryBuilder('knockoutPrediction')
            .leftJoinAndSelect('knockoutPrediction.selectedTeam', 'selectedTeam')
            .leftJoinAndSelect('knockoutPrediction.participant', 'participant')
            .leftJoinAndSelect('knockoutPrediction.homeTeam', 'homeTeam')
            .leftJoinAndSelect('knockoutPrediction.awayTeam', 'awayTeam')
            .leftJoinAndSelect('knockoutPrediction.knockout', 'knockout')
            .leftJoinAndSelect('knockout.homeTeam', 'kohomeTeam')
            .leftJoinAndSelect('knockout.awayTeam', 'koawayTeam')
            .leftJoinAndSelect('knockout.winnerTeam', 'winnerTeam')
            .where('participant.id = :participantId', {participantId})
            .orderBy('knockout.ordering', "ASC")
            .getMany();

    }

    async findKnockoutForTeamInRound(roundId, teamId: string): Promise<any> {
        const team = await this.connection
            .getRepository(Team).createQueryBuilder('team')
            .leftJoinAndSelect('team.knockoutsHome', 'home')
            .leftJoinAndSelect('team.knockoutsAway', 'away')
            .leftJoinAndSelect('team.knockoutsWinner', 'winner')
            .where('team.id = :teamId', {teamId})
            .getOne()

        if (roundId === '1') {
            const kos = await this.connection
                .getRepository(KnockoutPrediction).createQueryBuilder('knockoutPrediction')
                .leftJoinAndSelect('knockoutPrediction.participant', 'participant')
                .leftJoinAndSelect('knockoutPrediction.selectedTeam', 'selectedTeam')
                .leftJoinAndSelect('knockoutPrediction.awayTeam', 'awayTeam')
                .leftJoinAndSelect('knockoutPrediction.knockout', 'knockout')
                .where('knockout.round = :roundId', {roundId: '2'})
                .andWhere('selectedTeam.id = :teamId', {teamId})
                .getMany();

            return {
                round: roundId,
                team: {
                    id: team.id,
                    logoUrl: team.logoUrl,
                    name: team.name,
                    isInRound: team.knockoutsWinner.length > 0,
                    points: team.knockoutsWinner.length > 0 ? this.getPointsForKnockout(roundId) : 0
                },
                participants: kos.map(ko => {
                    return {
                        participant: ko.participant
                    }
                })
            }
        } else {
            const kos = await this.connection
                .getRepository(KnockoutPrediction).createQueryBuilder('knockoutPrediction')
                .leftJoinAndSelect('knockoutPrediction.participant', 'participant')
                .leftJoinAndSelect('knockoutPrediction.homeTeam', 'homeTeam')
                .leftJoinAndSelect('knockoutPrediction.awayTeam', 'awayTeam')
                .leftJoinAndSelect('knockoutPrediction.knockout', 'knockout')
                .where('knockout.round = :roundId', {roundId})
                .andWhere(new Brackets(qb => {
                    qb.where('homeTeam.id = :teamId', {teamId})
                        .orWhere('awayTeam.id = :teamId', {teamId})
                }))
                .getMany();
            return {
                round: roundId,
                team: {
                    id: team.id,
                    logoUrl: team.logoUrl,
                    name: team.name,
                    isInRound: team.knockoutsHome.length > 0 || team.knockoutsAway.length > 0,
                    points: team.knockoutsHome.length > 0 || team.knockoutsAway.length > 0 ? this.getPointsForKnockout(roundId) : 0
                },
                participants: kos.map(ko => {
                    return {
                        participant: ko.participant
                    }
                })
            }
        }
    }

    async createKnockoutPrediction(items: CreateKnockoutPredictionDto[], firebaseIdentifier): Promise<KnockoutPrediction[]> {

        const participant = await this.connection.getRepository(Participant)
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();

        return await this.knockoutPredictionRepository.save(items.map(p => {
            return {
                ...p,
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

    transformMatchToPrediction(i): any {
        return {homeScore: null, awayScore: null, match: i};
    }

    private getPointsForKnockout(round): number {
        switch (round) {
            case '16':
                return 10
            case '8':
                return 25
            case '4':
                return 45
            case '2':
                return 80
            case '1':
                return 150
            default:
                return null
        }
    }
}
