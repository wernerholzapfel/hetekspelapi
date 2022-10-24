import {Body, Controller, Get, Param, Post, Put, Req} from '@nestjs/common';
import {KnockoutService} from "./knockout.service";
import {Knockout} from "./knockout.entity";
import {CreateKnockoutDto, UpdateKnockoutDto} from "./create-knockout.dto";

@Controller('knockout')
export class KnockoutController {
    constructor(private readonly service: KnockoutService) {
    }

    @Get('mine')
    async findKnockouts(@Req() req): Promise<Knockout[]> {
        return this.service.findKnockouts(req.user.uid);
    }

    @Get()
    async knockoutsResults(@Req() req): Promise<Knockout[]> {
        return this.service.getKnockoutResults();
    }
    
    @Get('rightpredicted')
    async knockoutsRightPredicted(@Req() req): Promise<Knockout[]> {
        return this.service.getKnockoutsRightPredicted();
    }

    @Post()
    async create(@Req() req, @Body() createKnockoutDto: CreateKnockoutDto[]) {
        return await this.service.create(createKnockoutDto)
    }

    @Put()
    async update(@Req() req, @Body() updateKnockoutDto: UpdateKnockoutDto) {
        return await this.service.update(updateKnockoutDto)
    }

}
