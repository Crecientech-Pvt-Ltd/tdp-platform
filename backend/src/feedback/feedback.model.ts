export type FeedbackStatus = 'pending' | 'taken';

export interface Feedback {
  id: string;
  name: string;
  email: string;
  text: string;
  status: FeedbackStatus;
}
