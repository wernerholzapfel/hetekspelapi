import {Controller, Get} from '@nestjs/common';
import {HetekspelService} from "./hetekspel.service";
import {Hetekspel} from "./hetekspel.entity";

@Controller('hetekspel')
export class HetekspelController {

    constructor(private readonly hetekspelService: HetekspelService) {
    }

    @Get()
    async find(): Promise<Hetekspel> {
        return this.hetekspelService.find();
    }
}
