export interface UserProfile {
  id: number;
  created_at: string;
  user_id: string; // UUID vindo do auth.users
  name: string | null;
  avatar_url: string | null;
}