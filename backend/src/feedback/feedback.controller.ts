import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto, UpdateFeedbackStatusDto } from './feedback.dto';
import { FeedbackStatus } from './feedback.model';

@Controller('api/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  create(@Body() dto: CreateFeedbackDto) {
    return this.feedbackService.createFeedback(dto);
  }

  @Get()
  findAll(
    @Query('status') status?: FeedbackStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('pageSize', new DefaultValuePipe(10), ParseIntPipe) pageSize = 10,
  ) {
    return this.feedbackService.getAllFeedbacks(status, page, pageSize);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFeedbackStatusDto) {
    return this.feedbackService.markFeedbackTaken(id, dto.status);
  }
}
