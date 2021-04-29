import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Team} from './team.entity';
import {TeamService} from './team.service';
import {TeamController} from './team.controller';
import {StandService} from "../stand/stand.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Team]),
        TeamModule],
    providers: [TeamService, StandService],
    controllers: [TeamController],
})
export class TeamModule {
}
