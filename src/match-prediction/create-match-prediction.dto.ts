import {IsDefined, IsNumber} from 'class-validator';
import {Match} from '../match/match.entity';

export class CreateMatchPredictionDto {
    readonly id: string;

    @IsNumber() readonly homeScore: number;
    @IsNumber() readonly awayScore: number;
    @IsDefined() match: Match;
}
