export interface MatchingPair {
  id: string
  term: string
  definition: string
}

export interface SentenceCompletionBlank {
  id: string
  label: string
  correctValue: string
}

export interface MultipleChoiceOption {
  id: string
  text: string
}

export type TaskType = 'matching' | 'completion' | 'multiple_choice' | 'tfng'

export interface QuestionTask {
  id: string
  type: TaskType
  taskNumber: number
  title: string
  description?: string
  matchingPairs?: MatchingPair[]
  unassignedDefinitions?: string[]
  sentenceTemplate?: string // e.g. "The transition toward remote work was largely facilitated by {0} platforms..."
  completionBlanks?: SentenceCompletionBlank[]
  mcQuestion?: string
  mcOptions?: MultipleChoiceOption[]
}

export interface ReadingPassageData {
  id: string
  unitTitle: string
  passageTitle: string
  imageUrl?: string
  paragraphs: {
    id: string
    text: string
    highlighted?: boolean
  }[]
}

export interface SkillStat {
  id: string
  title: string
  description: string
  correctCount: number
  totalCount: number
  percentage: number
  color: 'blue' | 'emerald' | 'rose'
  iconType: 'choice' | 'tfng' | 'matching'
}

export interface ReviewQuestionItem {
  id: string
  qNumber: number
  typeLabel: string
  questionText: string
  isCorrect: boolean
  userAnswer: string
  correctAnswer?: string
  explanation?: string
  matchingPairs?: { term: string; definition: string }[]
  options?: { id: string; text: string; isUserAnswer?: boolean; isCorrectAnswer?: boolean }[]
  paragraphIdRef?: string
}

export interface ContinueLearningCardData {
  id: string
  title: string
  description: string
  category: 'listening' | 'writing' | 'vocabulary'
  href: string
}

export interface ReadingResultData {
  testTitle: string
  testSubtitle: string
  overallScore: number
  proficiencyLevel: string
  performanceMessage: string
  skills: SkillStat[]
  passage: ReadingPassageData
  reviews: ReviewQuestionItem[]
  continueModules: ContinueLearningCardData[]
}
