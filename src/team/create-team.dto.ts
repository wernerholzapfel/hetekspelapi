import {IsDefined, IsInt, IsString, Max, Min} from 'class-validator';

export class CreateTeamDto {
    readonly id: string;
    @IsDefined() @IsString() readonly team: string;
    @IsDefined() @IsString() readonly logoUrl: string;

}

export class UpdateTeamPositionDto {
    @IsDefined() readonly id: string;
    @IsDefined() @IsInt() @Min(1) @Max(4)
    readonly poulePosition: number;
}
