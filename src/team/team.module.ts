import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Team} from './team.entity';
import {TeamService} from './team.service';
import {TeamController} from './team.controller';
import {StandService} from "../stand/stand.service";
import { StandModule } from '../stand/stand.module';
import { Knockout } from '../knockout/knockout.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Team, Knockout]),
        StandModule],
    providers: [TeamService],
    controllers: [TeamController],
})
export class TeamModule {
}
