export interface QuizQuestion {
  Question: string;
  OptionA: string;
  OptionB: string;
  OptionC: string;
  OptionD: string;
  CorrectAnswer: string; // "A" | "B" | "C" | "D"
}

export interface QuizResult {
  timestamp: string;
  studentName: string;
  studentClass?: string;
  score: number;
  totalQuestions: number;
}
