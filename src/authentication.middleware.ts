import {
    ForbiddenException,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    NestMiddleware,
    UnauthorizedException
} from '@nestjs/common';
import 'dotenv/config';
import * as admin from 'firebase-admin';
import {getRepository} from 'typeorm';

@Injectable()
export class AddFireBaseUserToRequest implements NestMiddleware {
    private readonly logger = new Logger('AddFireBaseUserToRequest', true);

    use(req, res, next) {
        const extractedToken = getToken(req.headers);
        if (extractedToken) {
            admin.auth().verifyIdToken(extractedToken)
                .then(decodedToken => {
                    const uid = decodedToken.uid;
                    this.logger.log('uid: ' + uid);
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
    private readonly logger = new Logger('AdminMiddleware', true);

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
    private readonly logger = new Logger('AdminMiddleware', true);

    use(req, res, next) {
        const extractedToken = getToken(req.headers);
        if (extractedToken) {
            admin.auth().verifyIdToken(extractedToken).then((claims) => {
                this.logger.log(claims);
                if (claims.admin === true) {
                    next();
                } else {
                    this.logger.log('check if registration closed with claim');
                    return checkIfRegistrationIsClosed()
                }
            });
        } else {
            this.logger.log('check if registration closed withoutclaim');

            return checkIfRegistrationIsClosed();
        }

        function checkIfRegistrationIsClosed() {
            // return getRepository(Competition).findOne({isActive: true}).then(competition => {
            //     competition.deadline > new Date()
            //         ? next(new HttpException('No-Content', HttpStatus.NO_CONTENT))
            //         :
            next();
            // });
        }

    };

}

@Injectable()
export class CanSavePrediction implements NestMiddleware {
    private readonly logger = new Logger('CanSavePrediction', true);

    use(req, res, next) {
        return checkIfRegistrationIsClosed();

        function checkIfRegistrationIsClosed() {
            // return getRepository(Competition).findOne({isActive: true}).then(competition => {
            //     competition.deadline < new Date()
            //         ? next(new HttpException('', HttpStatus.FORBIDDEN))
            //         : next();
            // });
        }
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
