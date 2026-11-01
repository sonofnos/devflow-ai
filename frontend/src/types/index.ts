export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Snippet {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
  ai_explanation: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  ai_priority_reason: string | null;
  created_at: string;
}
