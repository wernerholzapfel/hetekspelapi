import { CacheInterceptor, ExecutionContext, Injectable, Logger } from "@nestjs/common";

@Injectable()
export default class CustomHttpCacheInterceptor extends CacheInterceptor {
  private readonly logger = new Logger('CustomHttpCacheInterceptor', { timestamp: true });

  httpServer: any;
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    const isGetRequest = request.method === 'GET';
    const requestURl = request.path;
    const excludePaths = ['/match-prediction/today', '/participant/mine', '/match-prediction', '/poule-prediction', '/knockout/mine'
    , 'poule-prediction/poule/a', 'poule-prediction/poule/b', 'poule-prediction/poule/c', 'poule-prediction/poule/d'
    , 'poule-prediction/poule/e', 'poule-prediction/poule/f', 'poule-prediction/poule/g', 'poule-prediction/poule/h'];

    if (
      !isGetRequest ||
      (isGetRequest && excludePaths.some(url => requestURl.includes(url)))
    ) {
      this.logger.log('niet cachen')
      return undefined;
    }
    return requestURl;
  }
}
