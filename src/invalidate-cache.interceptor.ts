import {
    CACHE_MANAGER,
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    Logger,
    NestInterceptor
} from '@nestjs/common';
import {Observable} from 'rxjs';
import {tap} from "rxjs/operators";
import {Cache} from 'cache-manager'

@Injectable()
export class InvalidateCacheInterceptor implements NestInterceptor {
    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {
    }
    private readonly logger = new Logger('InvalidateCacheInterceptor', {timestamp: true});

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        this.logger.log(context.switchToHttp().getRequest().method)
        return next.handle().pipe(tap(async () => {
            if (context.switchToHttp().getRequest().method === 'POST' ||
                context.switchToHttp().getRequest().method === 'PUT') {
                this.logger.log('invalidate cache')
                await this.cacheManager.reset();
            }
        }));
    }
}
