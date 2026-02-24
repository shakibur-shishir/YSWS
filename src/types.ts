export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  batch: number;
  bio?: string;
  phone?: string;
  social_links?: string;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  status: string;
  author_id: number;
  author_name: string;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
