export type Session = {
  SessionId: number;
  UserId: string; // UUID
  YearId: number;
  SessionLength: number;
  SessionNote?: string;
  SessionStartTime: string; // ISO timestamp
};