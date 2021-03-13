import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import {Connection, getManager, Repository} from 'typeorm';
import {MatchPrediction} from '../match-prediction/match-prediction.entity';
import {InjectRepository} from '@nestjs/typeorm';
import {Knockout} from "./knockout.entity";
import {CreateKnockoutDto} from "./create-knockout.dto";
import {Participant} from "../participant/participant.entity";

@Injectable()
export class KnockoutService {
    constructor(private readonly connection: Connection,
                @InjectRepository(Knockout)
                private readonly repository: Repository<Knockout>) {
    }

    async findKnockouts(firebaseIdentifier: string): Promise<any[]> { // todo model aanmaken

        const participant = await this.connection.getRepository(Participant)
            .createQueryBuilder('participant')
            .where('participant.firebaseIdentifier = :firebaseIdentifier', {firebaseIdentifier})
            .getOne();

        console.log(participant);
        const knockout: any[] = await this.connection.getRepository(Knockout)
            .createQueryBuilder('knockout')
            .leftJoinAndSelect('knockout.homeTeam', 'homeTeam')
            .leftJoinAndSelect('knockout.awayTeam', 'awayTeam')
            .leftJoinAndMapOne('knockout.prediction','knockout.knockoutPredictions', 'knockoutPredictions', "knockoutPredictions.participant.id = :participantId", {participantId: participant.id})
            .leftJoinAndSelect('knockoutPredictions.selectedTeam', 'selectedTeam')
            .getMany();

        return knockout.map(ko => {

            const hasPrediction =  ko.prediction
            return {
                ...ko,
                // prediction: hasPrediction ? ko.knockoutPredictions : null,
                selectedTeam: hasPrediction ? {id: ko.prediction.selectedTeam.id} : null
            }
        })
    }

    async create(items: CreateKnockoutDto[]): Promise<Knockout[]> {
        await items.forEach(async item => {
            await this.repository.save(item)
                .catch((err) => {
                    throw new HttpException({
                        message: err.message,
                        statusCode: HttpStatus.BAD_REQUEST,
                    }, HttpStatus.BAD_REQUEST);
                });
        })
        return await this.repository.find()
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
