export enum StudyAidType {
  SUMMARY = 'Summary',
  FLASHCARDS = 'Flashcards',
  QUIZ = 'Quiz',
  Q_AND_A = 'Q&A',
}

export interface Flashcard {
  term: string;
  definition: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
