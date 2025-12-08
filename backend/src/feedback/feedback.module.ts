import { Module } from '@nestjs/common';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
