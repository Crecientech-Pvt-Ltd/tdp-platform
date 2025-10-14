import { Injectable } from '@nestjs/common';
import { ClickhouseService } from '../clickhouse/clickhouse.service';
import { CreateFeedbackDto } from './feedback.dto';
import { FeedbackStatus } from './feedback.model';
import { nanoid } from 'nanoid';

@Injectable()
export class FeedbackService {
  constructor(private readonly clickhouseService: ClickhouseService) {}

  async createFeedback(dto: CreateFeedbackDto) {
    const id = nanoid();
    const createdAt = new Date();
    const status: FeedbackStatus = 'pending';
    const pad = (n: number) => n.toString().padStart(2, '0');
    const formatDate = (date: Date) =>
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    const createdAtStr = formatDate(createdAt);

    await this.clickhouseService['client'].insert({
      table: 'feedback',
      values: [
        {
          id,
          name: dto.name,
          email: dto.email,
          text: dto.feedback,
          status,
          createdAt: createdAtStr,
        },
      ],
      format: 'JSONEachRow',
    });
    return {
      id,
      name: dto.name,
      email: dto.email,
      text: dto.feedback,
      status,
      createdAt,
    };
  }

  async getAllFeedbacks(status?: FeedbackStatus, page = 1, pageSize = 10) {
    const offset = (page - 1) * pageSize;
    let whereClause = '';
    const params: Record<string, any> = { limit: pageSize, offset };
    if (status) {
      whereClause = 'WHERE status = {status:String}';
      params.status = status;
    }
    const query = `
      SELECT id, name, email, text, status, createdAt
      FROM feedback
      ${whereClause}
      ORDER BY status ASC, createdAt DESC
      LIMIT {limit:UInt64} OFFSET {offset:UInt64}
    `;
    const countQuery = `
      SELECT count() as total
      FROM feedback
      ${whereClause}
    `;
    const feedbacks: any[] = [];
    const resultSet = await this.clickhouseService['client'].query({
      query,
      query_params: params,
      format: 'JSONEachRow',
    });
    for await (const rows of resultSet.stream<any>()) {
      for (const row of rows) {
        feedbacks.push(row.json());
      }
    }

    let total = 0;
    const countSet = await this.clickhouseService['client'].query({
      query: countQuery,
      query_params: params,
      format: 'JSONEachRow',
    });
    for await (const rows of countSet.stream<any>()) {
      for (const row of rows) {
        total = row.json().total;
      }
    }
    return { data: feedbacks, total };
  }

  async markFeedbackTaken(id: string, status: FeedbackStatus) {
    const query = `
      ALTER TABLE feedback UPDATE status = {status:String} WHERE id = {id:String}
    `;
    await this.clickhouseService['client'].command({
      query,
      query_params: { id, status },
    });
    return { id, status };
  }
}
