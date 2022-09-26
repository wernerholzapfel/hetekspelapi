import {Injectable} from '@nestjs/common';
import {Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import {Hetekspel} from "./hetekspel.entity";

@Injectable()
export class HetekspelService {

    constructor(@InjectRepository(Hetekspel)
                private readonly hetEkSpelRepo: Repository<Hetekspel>) {
    }

    async find(): Promise<Hetekspel> {
        return await this.hetEkSpelRepo
            .createQueryBuilder('hetekspel')
            .getOne();
    }
}
