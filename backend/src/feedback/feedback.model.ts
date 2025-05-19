import { Entity, PrimaryColumn, Column } from 'typeorm';

export type FeedbackStatus = 'pending' | 'taken';

@Entity()
export class Feedback {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  text: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: FeedbackStatus;

  @Column({ type: 'timestamp', nullable: true })
  createdAt: Date;
}
