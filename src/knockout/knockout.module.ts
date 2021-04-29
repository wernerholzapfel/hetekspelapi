import {Module} from '@nestjs/common';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Knockout} from "./knockout.entity";
import {KnockoutController} from "./knockout.controller";
import {KnockoutService} from "./knockout.service";
import {StandService} from "../stand/stand.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([Knockout]),
        KnockoutModule],
    controllers: [KnockoutController],
    providers: [KnockoutService, StandService]
})
export class KnockoutModule {
}
