import {CacheInterceptor, CacheModule, MiddlewareConsumer, Module, RequestMethod} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {AddFireBaseUserToRequest, AdminMiddleware, IsRegistrationClosed} from './authentication.middleware';
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
import {StandModule} from "./stand/stand.module";
import {NotificationModule} from './notification/notification.module';
import {PushtokenModule} from './pushtoken/pushtoken.module';
import {Pushtoken} from "./pushtoken/pushtoken.entity";
import {Hetekspel} from "./hetekspel/hetekspel.entity";
import {HetekspelModule} from './hetekspel/hetekspel.module';
import {HeadlineModule} from './headline/headline.module';
import {Headline} from "./headline/headline.entity";
import {StatsModule} from './stats/stats.module';
import {APP_INTERCEPTOR} from "@nestjs/core";
import {InvalidateCacheInterceptor} from "./invalidate-cache.interceptor";

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
                KnockoutPrediction,
                Pushtoken,
                Hetekspel,
                Headline,
            ],
            logging: false,
            synchronize: false, // DEV only, do not use on PROD!
        }), ParticipantsModule,
        CacheModule.register({
            ttl: null, // seconds
            // maximum number of items in cache
        }),
        TeamModule,
        MatchModule,
        MatchPredictionModule,
        PoulePredictionModule,
        KnockoutModule,
        KnockoutPredictionModule,
        StandModule,
        NotificationModule,
        PushtokenModule,
        HetekspelModule,
        HeadlineModule,
        StatsModule
    ],
    controllers: [AppController],
    providers: [AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: CacheInterceptor,
        }, {
            provide: APP_INTERCEPTOR,
            useClass: InvalidateCacheInterceptor,
        }
    ]
})
export class AppModule {

    configure(consumer: MiddlewareConsumer): void {

        consumer.apply(IsRegistrationClosed).forRoutes(
            {path: 'match-prediction', method: RequestMethod.POST},
            {path: 'knockout-prediction', method: RequestMethod.POST},
            {path: 'poule-prediction', method: RequestMethod.POST},
        )

        consumer.apply(AddFireBaseUserToRequest).forRoutes(
            {path: '/**', method: RequestMethod.POST},
            {path: '/**', method: RequestMethod.PUT},
            {path: '/**', method: RequestMethod.DELETE},
            {path: 'participant', method: RequestMethod.POST},
            {path: 'participant/pushtoken', method: RequestMethod.PUT},
            {path: 'poule-prediction', method: RequestMethod.POST},
            {path: '/participant/mine', method: RequestMethod.GET},
            {path: '/match-prediction', method: RequestMethod.GET},
            {path: '/match-prediction/**', method: RequestMethod.GET},
            {path: '/knockout/mine', method: RequestMethod.GET},
            {path: '/knockout-prediction', method: RequestMethod.POST},
            {path: '/match', method: RequestMethod.POST},
            {path: '/match', method: RequestMethod.PUT},
            {path: '/knockout', method: RequestMethod.POST},
            {path: '/knockout', method: RequestMethod.PUT},
            {path: '/team', method: RequestMethod.PUT},
            {path: '/notification', method: RequestMethod.POST},
            {path: '/headline', method: RequestMethod.POST},
            {path: '/stand', method: RequestMethod.POST},
            {path: '/stats/**', method: RequestMethod.POST},
            {path: '/poule-prediction', method: RequestMethod.GET});

        consumer.apply(AdminMiddleware).forRoutes(
            {path: '/match', method: RequestMethod.POST},
            {path: '/match', method: RequestMethod.PUT},
            {path: '/knockout', method: RequestMethod.POST},
            {path: '/knockout', method: RequestMethod.PUT},
            {path: '/team', method: RequestMethod.PUT},
            {path: '/notification', method: RequestMethod.POST},
            {path: '/notification/**', method: RequestMethod.POST},
            {path: '/headline', method: RequestMethod.POST},
            {path: '/stand', method: RequestMethod.POST},
            {path: '/stats/**', method: RequestMethod.POST},
        )
    }
}
