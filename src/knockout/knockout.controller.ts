import {Body, Controller, Get, Param, Post, Req} from '@nestjs/common';
import {KnockoutService} from "./knockout.service";
import {Knockout} from "./knockout.entity";
import {CreateKnockoutDto} from "./create-knockout.dto";

@Controller('knockout')
export class KnockoutController {
    constructor(private readonly service: KnockoutService) {
    }

    @Get()
    async findKnockouts(@Req() req): Promise<Knockout[]> {
        return this.service.findKnockouts(req.user.uid);
    }

    @Post()
    async create(@Req() req, @Body() createKnockoutDto: CreateKnockoutDto[]) {
        return await this.service.create(createKnockoutDto)
    }

}
