export interface Student {
  studentKey: string; // 예: "2026-4-1-05"
  year: number; // 2026
  grade: number; // 4
  classNum: number; // 1~15
  studentNum: number; // 1~40
  name: string;
  passwordHash: string;
  mustResetPassword?: boolean;
  createdAt: string;
}

export type MissionType = 'acid_rain' | 'target_cpm' | 'zero_error';

export interface TypingRecord {
  id?: string;
  studentKey: string;
  studentName: string;
  missionType: MissionType;
  cpm: number;
  accuracy: number;
  isSuccess: boolean;
  score: number;
  mistakes: string[]; // 틀리거나 놓친 단어/문장
  timestamp: string;
}

export interface StudentSummary {
  studentKey: string;
  name: string;
  classNum: number;
  studentNum: number;
  maxCpm: number;
  avgAccuracy: number;
  totalPlays: number;
  completedMissions: MissionType[];
  lastUpdated: string;
}

export interface AppSetting {
  key: string;
  classPasswordHash: string;
  teacherPasswordHash: string;
}

export interface WordItem {
  id: string;
  word: string;
  meaning: string;
  category: '어휘' | '맞춤법' | '교과용어';
}

export interface SentenceItem {
  id: string;
  sentence: string;
  meaning?: string;
  category: '속담' | '교과서문장' | '맞춤법';
  targetCpm?: number;
}
