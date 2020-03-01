import {IsDefined, IsNumber} from 'class-validator';
import {Team} from '../team/team.entity';

export class CreatePoulePredictionDto {
    readonly id: string;

    @IsDefined() readonly team: Team;
    @IsDefined() poule: string;
    @IsNumber() readonly position: number;
}
