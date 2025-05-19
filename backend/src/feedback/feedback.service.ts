import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFeedbackDto } from './feedback.dto';
import { Feedback, FeedbackStatus } from './feedback.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepo: Repository<Feedback>,
  ) {}

  async createFeedback(dto: CreateFeedbackDto) {
    const feedback = this.feedbackRepo.create({
      id: uuidv4(),
      name: dto.name,
      email: dto.email,
      text: dto.feedback,
      status: 'pending',
      createdAt: new Date(),
    });
    await this.feedbackRepo.save(feedback);
    return feedback;
  }

  async getAllFeedbacks(status?: FeedbackStatus) {
    const where = status ? { status } : {};
    const feedbacks = await this.feedbackRepo.find({
      where,
      order: {
        status: 'ASC',
        createdAt: 'DESC',
      },
    });
    return [
      ...feedbacks.filter((f) => f.createdAt),
      ...feedbacks.filter((f) => !f.createdAt),
    ];
  }

  async markFeedbackTaken(id: string, status: FeedbackStatus) {
    await this.feedbackRepo.update({ id }, { status });
    return { id, status };
  }
}
