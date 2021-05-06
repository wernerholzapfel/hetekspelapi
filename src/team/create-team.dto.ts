import {IsDefined, IsIn, IsInt, IsString, Max, Min} from 'class-validator';

export class CreateTeamDto {
    readonly id: string;
    @IsDefined() @IsString() readonly team: string;
    @IsDefined() @IsString() readonly logoUrl: string;

}

export class UpdateTeamPositionDto {
    @IsDefined() readonly id: string;
    @IsIn([true, false, null]) readonly isEliminated: boolean;
    @IsIn([true, false, null]) readonly isPositionFinal: boolean;
    @IsDefined() readonly eliminationRound: string;
    @IsDefined() @IsInt() @Min(1) @Max(4)
    readonly poulePosition: number;
}
