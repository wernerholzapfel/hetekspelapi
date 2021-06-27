import {Body, Controller, Get, Param, Post, Req} from '@nestjs/common';
import {CreateMatchPredictionDto} from './create-match-prediction.dto';
import {MatchPrediction} from './match-prediction.entity';
import {MatchPredictionService} from './match-prediction.service';
import {KnockoutPrediction} from "../knockout-prediction/knockout-prediction.entity";
import {Knockout} from "../knockout/knockout.entity";

@Controller('match-prediction')
export class MatchPredictionController {

    constructor(private readonly service: MatchPredictionService) {
    }

    @Get()
    async findMatchesForLoggedInUser(@Req() req): Promise<MatchPrediction[]> {
        return this.service.findMatchesForLoggedInUser(req.user.uid);
    }

    @Get('today')
    async findTodaysMatchesForLoggedInUser(@Req() req): Promise<{ predictionType: string, knockout: Knockout[], matchPredictions?: MatchPrediction[], knockoutPredictions?: KnockoutPrediction[] }> {
        return this.service.findTodaysMatchesForLoggedInUser(req.user.uid);
    }

    @Get(':id')
    async findMatchesForParticipant(@Req() req, @Param('id') id: string): Promise<MatchPrediction[]> {
        return this.service.findMatchesForParticipant(id);
    }

    @Post()
    async create(@Req() req, @Body() createMatchPredictionDto: CreateMatchPredictionDto) {
        return await this.service.createMatchPrediction(createMatchPredictionDto, req.user.uid)
    }
}
