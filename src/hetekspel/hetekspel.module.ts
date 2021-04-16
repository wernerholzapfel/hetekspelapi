import { Module } from '@nestjs/common';
import { HetekspelService } from './hetekspel.service';
import { HetekspelController } from './hetekspel.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Hetekspel} from "./hetekspel.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Hetekspel])],
  providers: [HetekspelService],
  controllers: [HetekspelController]
})
export class HetekspelModule {}
