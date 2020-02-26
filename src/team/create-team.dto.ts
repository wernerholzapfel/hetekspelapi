import {IsDefined, IsString} from 'class-validator';
export class CreateTeamDto {
    readonly id: string;
    @IsDefined() @IsString()readonly team: string;
    @IsDefined() @IsString() readonly logoUrl: string;

}
