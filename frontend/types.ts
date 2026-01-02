
export interface SRSMetadata {
  n: number;          // Consecutive correct answers
  ef: number;         // Ease Factor (starting at 2.5)
  i: number;          // Interval in days
  lastReview: number; // Timestamp
  nextReview: number; // Timestamp
}

export interface MnemonicAssociation {
  medicalTerm: string;
  character: string;
  explanation: string;
  boundingBox?: [number, number, number, number];
  shape?: 'rect' | 'ellipse';
  srs?: SRSMetadata;  // Spaced Repetition state
}

export interface KeyFactsData {
  topic: string;
  facts: string[];
}

export interface MnemonicResponse extends KeyFactsData {
  story: string;
  associations: MnemonicAssociation[];
  visualPrompt: string;
}

export interface SavedStory extends MnemonicResponse {
  id: string;
  createdAt: number;
  imageData?: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  createdAt: number;
  story_ids: string[];
}


export interface QuizQuestion {
  associationIndex: number;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface DailyReviewItem {
  storyId: string;
  topic: string;
  imageData: string | null;
  association: MnemonicAssociation;
  question: QuizQuestion;
  relearnCount: number; // Track for re-learning loop
}

export type Language = 'en' | 'es';

export interface AppState {
  isLoading: boolean;
  step: 'input' | 'generating_plan' | 'review_plan' | 'generating_image' | 'analyzing_image' | 'complete' | 'loading_quiz' | 'quiz' | 'error' | 'library' | 'daily_review' | 'curriculum' | 'admin';
  error: string | null;
  factsData: KeyFactsData | null;
  data: MnemonicResponse | null;
  imageData: string | null;
  highlightedIndex: number | null;
  savedStories: SavedStory[];
  playlists: Playlist[];
  quizData: QuizQuestion[] | null;
  language: Language;
  reviewQueue: DailyReviewItem[];
  user: User | null;
  showAuthModal: boolean;

}

export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  order: number;
  concepts?: Concept[];
}

export interface Concept {
  id: string;
  topic_id: string;
  name: string;
  description?: string;
  facts: string[];
  order: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  concept_id: string;
  is_completed: boolean;
  last_accessed: number;
}

export enum InputMode {
  TEXT = 'TEXT',
  PDF = 'PDF'
}

