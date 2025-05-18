import { Injectable } from '@nestjs/common';
import { Neo4jService } from '@/neo4j/neo4j.service';
import { CreateFeedbackDto } from './feedback.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FeedbackService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async createFeedback(dto: CreateFeedbackDto) {
    const session = this.neo4jService.getSession('WRITE');
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const params = {
      id,
      name: dto.name,
      email: dto.email,
      text: dto.feedback,
      createdAt,
    };
    await session.run(
      `CREATE (f:Feedback {id: $id, name: $name, email: $email, text: $text, status: 'pending', createdAt: $createdAt}) RETURN f`,
      params,
    );
    await this.neo4jService.releaseSession(session, 'WRITE');
    return { id, ...dto, status: 'pending', createdAt };
  }

  async getAllFeedbacks(status?: string) {
    const session = this.neo4jService.getSession();
    let query: string;
    let params: any = {};
    if (status) {
      query = `
        MATCH (f:Feedback)
        WHERE f.status = $status
        RETURN f
        ORDER BY 
          CASE WHEN f.createdAt IS NOT NULL THEN 0 ELSE 1 END, 
          f.createdAt DESC
      `;
      params = { status };
    } else {
      query = `
        MATCH (f:Feedback)
        RETURN f
        ORDER BY 
          CASE f.status WHEN 'pending' THEN 0 ELSE 1 END,
          CASE WHEN f.createdAt IS NOT NULL THEN 0 ELSE 1 END,
          f.createdAt DESC
      `;
    }
    const result = await session.run(query, params);
    await this.neo4jService.releaseSession(session);
    return result.records.map((r) => r.get('f').properties);
  }

  async markFeedbackTaken(id: string, status: 'pending' | 'taken') {
    const session = this.neo4jService.getSession('WRITE');
    await session.run(
      'MATCH (f:Feedback {id: $id}) SET f.status = $status RETURN f',
      { id, status },
    );
    await this.neo4jService.releaseSession(session, 'WRITE');
    return { id, status };
  }
}
