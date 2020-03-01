import {Body, Controller, Get, Param, Post, Req} from '@nestjs/common';
import {CreatePoulePredictionDto} from './create-poule-prediction.dto';
import {PoulePredictionService} from './poule-prediction.service';
import {PoulePrediction} from './poule-prediction.entity';

@Controller('poule-prediction')
export class PoulePredictionController {

    constructor(private readonly service: PoulePredictionService) {
    }

    @Get()
    async findPoulePredictionsForParticipant(@Req() req): Promise<PoulePrediction[]> {
        return this.service.findPoulePredictionsForParticipant(req.user.uid);
    }

    @Post()
    async create(@Req() req, @Body() createPoulePredictionDto: CreatePoulePredictionDto[]) {
        return await this.service.createPoulePrediction(createPoulePredictionDto, req.user.uid)
    }


}
