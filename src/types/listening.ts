export interface ListeningPracticeCardData {
  id: string
  title: string
  subtitle: string
  category: 'listening' | 'reading' | 'speaking' | 'writing'
  progressPercentage: number
  isCompleted: boolean
  correctCount?: number
  totalCount?: number
  timeSpent?: string
  href: string
  question_types?: string[]
}

export interface KeyVocabWord {
  id: string
  word: string
  definition?: string
  ipa?: string
}

export interface ListeningQuestion {
  id: string
  qNumber: number
  title: string
  subtitle?: string
  type: 'mc' | 'transcript_completion' | 'sentiment_matching'
  mcOptions?: { id: string; text: string }[]
  selectedOptionId?: string
  transcriptTemplate?: string
  completionBlanks?: { id: string; placeholder: string; value: string }[]
  matchingPairs?: { speaker: string; state: string }[]
}

export interface DictationWordDiff {
  id: string
  word: string
  isCorrect: boolean
  userWord?: string
  correctWord?: string
}

export interface ListeningResultData {
  title: string
  subtitle: string
  overallAccuracy: number
  totalCorrect: number
  totalQuestions: number
  competency: {
    globalUnderstanding: number
    specificInformation: number
    inferenceAndTone: number
  }
  reviews: {
    id: string
    qNumber: number
    questionText: string
    isCorrect: boolean
    userAnswer: string
    correctAnswer: string
    clipTime: string
    hint?: string
  }[]
}
