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
    const params = {
      id,
      name: dto.name,
      email: dto.email,
      text: dto.feedback, // <-- map feedback to text
    };
    await session.run(
      `CREATE (f:Feedback {id: $id, name: $name, email: $email, text: $text, status: 'pending'}) RETURN f`,
      params,
    );
    await this.neo4jService.releaseSession(session, 'WRITE');
    return { id, ...dto, status: 'pending' };
  }

  async getAllFeedbacks(status?: string) {
    const session = this.neo4jService.getSession();
    let query = 'MATCH (f:Feedback)';
    if (status) query += ' WHERE f.status = $status';
    query += ' RETURN f ORDER BY f.id DESC';
    const result = await session.run(query, status ? { status } : {});
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
