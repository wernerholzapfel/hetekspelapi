import {Body, Controller, Get, Post, Req} from '@nestjs/common';
import {HeadlineService} from "./headline.service";
import {Headline} from "./headline.entity";
import {CreateHeadlineDto} from "./create-headline.dto";

@Controller('headline')
export class HeadlineController {

    constructor(private readonly headlineService: HeadlineService) {
    }
    @Get()
    async findAll(): Promise<Headline[]> {
        return this.headlineService.findAll();
    }

    @Post()
    async create(@Req() req, @Body() createHeadlineDto: CreateHeadlineDto) {
        return await this.headlineService.create(createHeadlineDto, req.user.uid);
    }
}
