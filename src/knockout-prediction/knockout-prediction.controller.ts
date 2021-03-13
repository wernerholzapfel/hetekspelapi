import {Body, Controller, Get, Param, Post, Req} from '@nestjs/common';
import {KnockoutPredictionService} from "./knockout-prediction.service";
import {KnockoutPrediction} from "./knockout-prediction.entity";
import {CreateKnockoutPredictionDto} from "./create-knockout-prediction.dto";

@Controller('knockout-prediction')
export class KnockoutPredictionController {

    constructor(private readonly service: KnockoutPredictionService) {
    }

    @Get()
    async findMatchesForParticipant(@Req() req): Promise<KnockoutPrediction[]> {
        return this.service.findKnockoutForParticipant(req.user.uid);
    }

    @Post()
    async create(@Req() req, @Body() createKnockoutPredictionDtos: CreateKnockoutPredictionDto[]) {
        return await this.service.createKnockoutPrediction(createKnockoutPredictionDtos, req.user.uid)
    }
}