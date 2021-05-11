import {IsDefined, IsNumber, IsOptional} from 'class-validator';
import {Match} from '../match/match.entity';

export class CreateMatchPredictionDto {
    @IsOptional() readonly id: string;
    @IsNumber() readonly homeScore: number;
    @IsNumber() readonly awayScore: number;
    @IsDefined() match: Match;
}
