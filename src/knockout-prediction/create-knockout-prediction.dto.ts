import {IsDefined, IsOptional} from 'class-validator';
import {Team} from "../team/team.entity";
import {Knockout} from "../knockout/knockout.entity";

export class CreateKnockoutPredictionDto {
    @IsOptional() readonly id: string;
    @IsDefined() matchId: string;
    @IsDefined() selectedTeam: Team;
    @IsDefined() awayTeam: Team;
    @IsDefined() homeTeam: Team;
    @IsDefined() knockout: Knockout;
}
