import {Controller, Get, Logger, Post, Req} from '@nestjs/common';
import {StatsService} from "./stats.service";

@Controller('stats')
export class StatsController {

    private readonly logger = new Logger('StatsController', {timestamp: true});

    constructor(private readonly service: StatsService) {
    }

    @Post('toto')
    async getTotoStats(): Promise<any[]> {
        return this.service.createTotoStats();
    }

    @Post('knockout')
    async getKnockoutStats(): Promise<any[]> {
        return this.service.createKnockoutStats();
    }

    @Get('complete')
    async getFormInformation(): Promise<any[]> {
        return this.service.getFormInformation();
    }

}
