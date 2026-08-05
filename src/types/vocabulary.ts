export interface WordDetail {
  id: string;
  word: string;
  word_type: string;
  meaning: string | null;
  ipa: string | null;
  example_sentence: string | null;
  image_url: string | null;
  learning_status: 'LEARNING' | 'MASTERED' | 'NEEDS_REVIEW';
}

export interface VocabularyCollection {
  id: string;
  title: string;
  description: string | null;
  topic: string;
  language: string;
  is_official: boolean;
  total_learners: number;
  accuracy_percentage: number;
  study_time_seconds: number;
  words_list: WordDetail[];
}

export interface CreateCollectionPayload {
  title: string;
  language: string;
  description?: string;
}

export interface AddWordPayload {
  word: string;
  word_type?: string;
  ipa?: string;
  meaning: string;
  example_sentence?: string;
  image_url?: string;
}

export interface BulkAddPayload {
  words: AddWordPayload[];
}

export interface UpdateWordStatusPayload {
  collection_id: string;
  word_id: string;
  status: 'LEARNING' | 'MASTERED' | 'NEEDS_REVIEW';
}

export interface UpdateProgressPayload {
  collection_id: string;
  accuracy_percentage: number;
  study_time_seconds: number;
}

export interface ProgressResponse {
  message: string;
  user_id: string;
  collection_id: string;
  total_mastered: number;
  total_learning: number;
  accuracy_percentage: number;
}

export type WordStatus = 'LEARNING' | 'MASTERED' | 'NEEDS_REVIEW';
export type DetailFilter = 'all' | WordStatus;
