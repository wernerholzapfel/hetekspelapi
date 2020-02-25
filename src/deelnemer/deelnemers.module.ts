import {Module} from '@nestjs/common';

import {DeelnemersController} from './deelnemers.controller';
import {DeelnemersService} from './deelnemers.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Deelnemer} from './deelnemer.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Deelnemer])],
    providers: [DeelnemersService],
    controllers: [DeelnemersController],
})

export class DeelnemersModule {
}
