import {IsDefined, IsEmail, IsString} from 'class-validator';

export class CreateParticipantDto {
    @IsEmail() readonly email: string;
    @IsDefined() @IsString() readonly displayName: string;
    @IsDefined() @IsString() readonly teamName: string;

}
