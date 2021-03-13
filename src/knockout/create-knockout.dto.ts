import {IsDefined, IsNumber, IsString} from 'class-validator';
import {Team} from '../team/team.entity';

export class CreateKnockoutDto {
    readonly id: string;

    @IsDefined() @IsString() readonly matchId: string;
    @IsDefined() @IsString() readonly homeId: string;
    @IsDefined() @IsString() readonly awayId: string;
    @IsDefined() @IsString() readonly city: string;
    @IsDefined() @IsString() readonly round: string;
}
