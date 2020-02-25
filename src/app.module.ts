import {MiddlewareConsumer, Module, RequestMethod} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {Deelnemer} from './deelnemer/deelnemer.entity';
import {DeelnemersModule} from './deelnemer/deelnemers.module';
import {AddFireBaseUserToRequest} from './authentication.middleware';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            extra: {
                ssl: process.env.DB_SSL
            },
            entities: [
                Deelnemer,
            ],
            logging: false,
            synchronize: true, // DEV only, do not use on PROD!
        }), DeelnemersModule
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {

    configure(consumer: MiddlewareConsumer): void {

        consumer.apply(AddFireBaseUserToRequest).forRoutes(
            {path: '/**', method: RequestMethod.POST});
    }
}
