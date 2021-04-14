import { Module } from '@nestjs/common';
import { HeadlineController } from './headline.controller';
import { HeadlineService } from './headline.service';
import {Headline} from "./headline.entity";
import {TypeOrmModule} from "@nestjs/typeorm";

@Module({
  imports: [TypeOrmModule.forFeature([Headline])],
  controllers: [HeadlineController],
  providers: [HeadlineService]
})
export class HeadlineModule {}
