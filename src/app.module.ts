import {MiddlewareConsumer, Module, RequestMethod} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AddFireBaseUserToRequest} from './authentication.middleware';
import {MatchModule} from './match/match.module';
import {MatchPredictionModule} from './match-prediction/match-prediction.module';
import {Match} from './match/match.entity';
import {MatchPrediction} from './match-prediction/match-prediction.entity';
import {Participant} from './participant/participant.entity';
import {ParticipantsModule} from './participant/participants.module';
import {Team} from './team/team.entity';
import {TeamModule} from './team/team.module';
import {PoulePredictionModule} from './poule-prediction/poule-prediction.module';
import {PoulePrediction} from './poule-prediction/poule-prediction.entity';
import {Knockout} from "./knockout/knockout.entity";
import {KnockoutModule} from "./knockout/knockout.module";
import {KnockoutPrediction} from "./knockout-prediction/knockout-prediction.entity";
import {KnockoutPredictionModule} from "./knockout-prediction/knockout-prediction.module";

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            extra: {
                ssl: process.env.DB_SSL
            },
            entities: [
                Participant,
                Team,
                Match,
                MatchPrediction,
                PoulePrediction,
                Knockout,
                KnockoutPrediction
            ],
            logging: true,
            synchronize: true, // DEV only, do not use on PROD!
        }), ParticipantsModule,
        TeamModule,
        MatchModule,
        MatchPredictionModule,
        PoulePredictionModule,
        KnockoutModule,
        KnockoutPredictionModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {

    configure(consumer: MiddlewareConsumer): void {

        consumer.apply(AddFireBaseUserToRequest).forRoutes(
            {path: '/**', method: RequestMethod.POST},
            {path: '/match-prediction', method: RequestMethod.GET},
            {path: '/match-prediction', method: RequestMethod.POST},
            {path: '/knockout/mine', method: RequestMethod.GET},
            {path: '/knockout-prediction', method: RequestMethod.POST},
            {path: '/poule-prediction', method: RequestMethod.GET},
            {path: '/poule-prediction', method: RequestMethod.POST});
    }
}
