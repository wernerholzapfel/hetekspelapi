import {Body, Controller, Get, Logger, Param, Post, Req} from '@nestjs/common';
import {StandService} from './stand.service';

@Controller('stand')
export class StandController {
    private readonly logger = new Logger('StandController', true);

    constructor(private readonly service: StandService) {
    }

    // todo weggooien wordt niet meer gebruikt sinds 4.6.0
    @Get('totaal')
    async getTotalStand(): Promise<any> {
        return this.service.getTotalStand();
    }

    @Post()
    async createTotalStand(@Req() req) {
        return this.service.createTotalStand();
    }
}
