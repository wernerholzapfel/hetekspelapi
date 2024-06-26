import {Body, Controller, Delete, Get, Param, Post, Req} from '@nestjs/common';
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
    @Get('getlatest')
    async getLatest(@Req() req): Promise<any[]> {
        return this.service.getLatest();
    }

    @Get(':id')
    async findKnockoutForParticipant(@Req() req, @Param('id') id: string): Promise<KnockoutPrediction[]> {
        return this.service.findKnockoutForParticipant(id);
    } 


    @Get('round/:roundid/team/:teamid')
    async findKnockoutForTeamInRound(@Req() req, @Param('roundid') roundId: string, @Param('teamid') teamId: string): Promise<KnockoutPrediction[]> {
        return this.service.findKnockoutForTeamInRound(roundId, teamId);
    }

    @Post()
    async create(@Req() req, @Body() createKnockoutPredictionDtos: CreateKnockoutPredictionDto[]) {
        return await this.service.createKnockoutPrediction(createKnockoutPredictionDtos, req.user.uid)
    }
    @Post('one')
    async createOne(@Req() req, @Body() createKnockoutPredictionDto: CreateKnockoutPredictionDto) {
        return await this.service.createKnockoutPredictionOne(createKnockoutPredictionDto, req.user.uid)
    }

    @Delete()
    async deleteKnokcoutPredictions(@Req() req) {
        return await this.service.deleteKnockoutPredictions(req.user.uid)
    }
}
