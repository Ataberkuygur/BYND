export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueAt?: string; // ISO
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  source: 'voice' | 'ai' | 'user';
}
