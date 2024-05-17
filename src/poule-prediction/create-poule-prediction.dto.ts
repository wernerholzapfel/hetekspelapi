import {IsDefined, IsNumber} from 'class-validator';
import {Team} from '../team/team.entity';

export class CreatePoulePredictionDto {
    readonly id: string;

    @IsDefined() readonly selected: boolean;
    @IsDefined() readonly positie: number;
    @IsDefined() readonly team: Team;
    @IsDefined() poule: string;
}
