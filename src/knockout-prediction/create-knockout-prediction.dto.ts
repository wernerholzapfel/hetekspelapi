import {IsDefined} from 'class-validator';
import {Team} from "../team/team.entity";
import {Knockout} from "../knockout/knockout.entity";

export class CreateKnockoutPredictionDto {
    readonly id: string;

    @IsDefined() selected: Team;
    @IsDefined() knockout: Knockout;
}
