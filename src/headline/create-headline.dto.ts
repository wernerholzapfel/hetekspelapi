import {IsBoolean, IsDefined, IsOptional, IsString} from 'class-validator';

export class CreateHeadlineDto {
    @IsOptional() id: string;
    @IsOptional() schrijver: string;
    @IsOptional() createdDate: string;
    @IsOptional() updatedDate: string;

    @IsDefined() @IsString() readonly title: string;
    @IsDefined() @IsString() readonly text: string;
    @IsDefined() @IsBoolean() readonly isActive: boolean;

}
