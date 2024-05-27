import {
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    NestMiddleware,
    UnauthorizedException
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import 'dotenv/config';
import * as admin from 'firebase-admin';
import {Repository} from 'typeorm';
import {Hetekspel} from "./hetekspel/hetekspel.entity";

@Injectable()
export class AddFireBaseUserToRequest implements NestMiddleware {
    private readonly logger = new Logger('AddFireBaseUserToRequest', {timestamp: true});

    use(req, res, next) {
        const extractedToken = getToken(req.headers);
        if (extractedToken) {
            admin.auth().verifyIdToken(extractedToken)
                .then(decodedToken => {
                    const uid = decodedToken.uid;
                    admin.auth().getUser(uid)
                        .then(userRecord => {
                            // See the UserRecord reference doc for the contents of userRecord.
                            this.logger.log('Successfully fetched user data for: ' + uid);
                            req.user = userRecord;
                            next();
                        })
                        .catch(error => {
                            this.logger.log('Error fetching user data:', error);
                        });
                }).catch(error => {
                this.logger.log('Error verify token:', error);
            });
        } else {
            next();
        }
    };
}


@Injectable()
export class AdminMiddleware implements NestMiddleware {
    private readonly logger = new Logger('AdminMiddleware', {timestamp: true});

    use(req, res, next) {
        const extractedToken = getToken(req.headers);
        if (extractedToken) {
            admin.auth().verifyIdToken(extractedToken).then((claims) => {
                this.logger.log(claims);
                if (claims.admin === true) {
                    this.logger.log('ik ben admin');
                    next();
                } else {

                    next(new ForbiddenException('Om wijzigingen door te kunnen voeren moet je admin zijn'));
                }
            });
        } else {
            next(new UnauthorizedException('We konden je niet verifieren, log opnieuw in.'));
        }
    };
}


@Injectable()
export class IsRegistrationClosed implements NestMiddleware {

    constructor(@InjectRepository(Hetekspel)
        private readonly hetEkSpelRepo: Repository<Hetekspel>) {

}
    private readonly logger = new Logger('IsRegistrationClosed', {timestamp: true});

    use(req, res, next) {
        this.logger.log('check is registrationclosed');

        return this.hetEkSpelRepo.findOneBy({}).then(hetekspel => {
            this.logger.log(hetekspel.deadline);
            this.logger.log(new Date());
            hetekspel.deadline < new Date()
                ? next(new HttpException('Deadline voor voorspellingen is verstreken', HttpStatus.FORBIDDEN))
                : next();
        });
    }
}


const getToken = headers => {
    if (headers && headers.authorization) {
        const parted = headers.authorization.split(' ');
        if (parted.length === 2) {
            return parted[1];
        } else {
            return null;
        }
    } else {
        return null;
    }
};
