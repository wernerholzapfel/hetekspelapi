import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Participant} from '../participant/participant.entity';
import {StandService} from './stand.service';
import {StandController} from './stand.controller';

@Module({
    imports: [
        TypeOrmModule.forFeature([Participant]),
        StandModule],
    providers: [StandService],
    controllers: [StandController]
})
export class StandModule {
}
