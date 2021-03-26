import {IsDefined, IsInt, IsNumber, IsString} from 'class-validator';

export class CreateKnockoutDto {
    readonly id: string;

    @IsDefined() @IsString() readonly matchId: string;
    @IsDefined() @IsString() readonly homeId: string;
    @IsDefined() @IsString() readonly awayId: string;
    @IsDefined() @IsString() readonly city: string;
    @IsDefined() @IsString() readonly round: string;
}

export class UpdateKnockoutDto {
    @IsDefined() @IsString() id: string;
    @IsDefined() homeTeam: { id: string };
    @IsDefined() awayTeam: { id: string };
    @IsDefined() winnerTeam: { id: string };
    @IsDefined() @IsInt() homeScore: number
    @IsDefined() @IsInt() awayScore: number
}
