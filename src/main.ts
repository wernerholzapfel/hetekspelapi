import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import logger from './common/logger';
import * as admin from 'firebase-admin';


admin.initializeApp({
    credential: admin.credential.cert({
            // @ts-ignore
            type: process.env.type,
            project_id: process.env.project_id,
            private_key_id: process.env.private_key_id,
            // private_key: process.env.private_key,
            private_key:  JSON.parse(process.env.private_key),
            client_email: process.env.client_email,
            client_id: process.env.client_id,
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://accounts.google.com/o/oauth2/token',
            auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.client_x509_cert_url,
        },
    ),
    databaseURL: process.env.firebase_databaseURL
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT || 3000);
  logger.info(`hetekspelapi server listening on port: ${process.env.PORT || 3000}`);

}

bootstrap()
    .catch(err => {
      logger.error(`Error in bootstrap', ${err.message}`);
    });
