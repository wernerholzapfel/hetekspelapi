import {Controller, Post, Req} from '@nestjs/common';
import {NotificationService} from "./notification.service";

@Controller('notification')
export class NotificationController {

    constructor(private readonly service: NotificationService) {
    }

    @Post()
    async createTotalStand(@Req() req) {
        return this.service.sendNotification();
    }
}
