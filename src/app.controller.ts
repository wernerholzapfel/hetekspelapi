import { Body, Controller, Get, Logger, Post, Req } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
    private readonly logger = new Logger('AppController', {timestamp: true});

  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  
  @Post('print')
  async printline(@Req() req, @Body() body): Promise<any> {
    this.logger.log(body)
    return body;
  }
}
