import {Body, Controller, Get, Param, Post, Req} from '@nestjs/common';
import {CreateMatchPredictionDto} from './create-match-prediction.dto';
import {MatchPrediction} from './match-prediction.entity';
import {MatchPredictionService} from './match-prediction.service';

@Controller('match-prediction')
export class MatchPredictionController {

    constructor(private readonly service: MatchPredictionService) {
    }

    @Get()
    async findMatchesForParticipant(@Req() req): Promise<MatchPrediction[]> {
        return this.service.findMatchesForParticipant(req.user.uid);
    }

    @Post()
    async create(@Req() req, @Body() createMatchPredictionDto: CreateMatchPredictionDto[]) {
        return await this.service.createMatchPrediction(createMatchPredictionDto, req.user.uid)
    }
}
