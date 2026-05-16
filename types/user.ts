export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isGuest: boolean;
  createdAt: number;
}

export interface AuthSession {
  user: User | null;
  ready: boolean;
}
