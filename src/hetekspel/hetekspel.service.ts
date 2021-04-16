import {Injectable} from '@nestjs/common';
import {Connection, Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import {Hetekspel} from "./hetekspel.entity";

@Injectable()
export class HetekspelService {

    constructor(private readonly connection: Connection,
                @InjectRepository(Hetekspel)
                private readonly headlineRepository: Repository<Hetekspel>,) {
    }

    async find(): Promise<Hetekspel> {
        return await this.connection
            .getRepository(Hetekspel)
            .createQueryBuilder('hetekspel')
            .getOne();
    }
}
