import {Module} from '@nestjs/common';
import {MatchController} from './match.controller';
import {MatchService} from './match.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Match} from './match.entity';
import { DataSource } from 'typeorm';

@Module({
    imports: [
        TypeOrmModule.forFeature([Match])],
    controllers: [MatchController],
    providers: [MatchService]
})
export class MatchModule {
}
