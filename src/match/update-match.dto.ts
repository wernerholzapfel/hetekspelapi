import {IsDefined, IsNumber} from 'class-validator';

export class UpdateMatchDto {
    @IsDefined() readonly id: string;
    @IsNumber() readonly homeScore: number;
    @IsNumber() readonly awayScore: number;

}
