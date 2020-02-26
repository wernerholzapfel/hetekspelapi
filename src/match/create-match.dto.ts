import {IsDefined, IsNumber, IsString} from 'class-validator';
import {Team} from '../team/team.entity';

export class CreateMatchDto {
    readonly id: string;

    @IsDefined() @IsString() readonly homeTeam: Team;
    @IsDefined() @IsString() readonly awayTeam: Team;
    @IsNumber() readonly homeScore: number;
    @IsNumber() readonly awayScore: number;

}
