import { Injectable } from '@nestjs/common';
import { CreateFeedbackDto } from './feedback.dto';
import { FeedbackStatus } from './feedback.model';
import { db } from '@/postgres';

@Injectable()
export class FeedbackService {
  async createFeedback(dto: CreateFeedbackDto) {
    const feedback = await db.feedback.create({
      data: {
        name: dto.name,
        email: dto.email,
        text: dto.feedback,
        status: 'pending',
      },
    });

    return feedback;
  }

  async getAllFeedbacks(status?: FeedbackStatus, page = 1, pageSize = 10) {
    const skip = (page - 1) * pageSize;
    const where = status ? { status } : {};

    const [data, total] = await Promise.all([
      db.feedback.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      db.feedback.count({ where }),
    ]);

    return { data, total };
  }

  async markFeedbackTaken(id: string, status: FeedbackStatus) {
    const feedback = await db.feedback.update({
      where: { id },
      data: { status },
    });

    return feedback;
  }
}
