import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StudyPlan {
  id: string;
  subject: string;
  title: string;
  description: string;
  durationMinutes: number;
  topics: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: number;
  startDate?: number;
  endDate?: number;
  completed: boolean;
  progress: number; // 0-100
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export interface Quiz {
  id: string;
  subject: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  createdAt: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  startedAt: number;
  completedAt?: number;
  answers: number[]; // index of selected answer for each question
  score: number; // percentage
  timeSpent: number; // seconds
}

export interface StudyRecommendation {
  id: string;
  subject: string;
  title: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  suggestedDuration: number; // minutes
  createdAt: number;
}

const PLANS_KEY = '@flowfocus_plans';
const QUIZZES_KEY = '@flowfocus_quizzes';
const ATTEMPTS_KEY = '@flowfocus_attempts';
const RECOMMENDATIONS_KEY = '@flowfocus_recommendations';

class PlannerService {
  private plans: Map<string, StudyPlan> = new Map();
  private quizzes: Map<string, Quiz> = new Map();
  private attempts: Map<string, QuizAttempt> = new Map();
  private recommendations: Map<string, StudyRecommendation> = new Map();

  async initialize() {
    try {
      const [plansData, quizzesData, attemptsData, recommendationsData] = await Promise.all([
        AsyncStorage.getItem(PLANS_KEY),
        AsyncStorage.getItem(QUIZZES_KEY),
        AsyncStorage.getItem(ATTEMPTS_KEY),
        AsyncStorage.getItem(RECOMMENDATIONS_KEY),
      ]);

      if (plansData) {
        const parsed = JSON.parse(plansData);
        this.plans = new Map(parsed);
      }

      if (quizzesData) {
        const parsed = JSON.parse(quizzesData);
        this.quizzes = new Map(parsed);
      }

      if (attemptsData) {
        const parsed = JSON.parse(attemptsData);
        this.attempts = new Map(parsed);
      }

      if (recommendationsData) {
        const parsed = JSON.parse(recommendationsData);
        this.recommendations = new Map(parsed);
      }
    } catch (error) {
      console.error('Error initializing planner:', error);
    }
  }

  // Study Plans
  async createPlan(
    subject: string,
    title: string,
    description: string,
    durationMinutes: number,
    topics: string[],
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<StudyPlan> {
    const id = `plan_${Date.now()}`;
    const plan: StudyPlan = {
      id,
      subject,
      title,
      description,
      durationMinutes,
      topics,
      difficulty,
      createdAt: Date.now(),
      completed: false,
      progress: 0,
    };

    this.plans.set(id, plan);
    await this.save();
    return plan;
  }

  getPlan(id: string): StudyPlan | undefined {
    return this.plans.get(id);
  }

  getPlans(): StudyPlan[] {
    return Array.from(this.plans.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getPlansBySubject(subject: string): StudyPlan[] {
    return this.getPlans().filter(p => p.subject.toLowerCase() === subject.toLowerCase());
  }

  getActivePlans(): StudyPlan[] {
    return this.getPlans().filter(p => !p.completed);
  }

  getCompletedPlans(): StudyPlan[] {
    return this.getPlans().filter(p => p.completed);
  }

  async updatePlan(id: string, updates: Partial<StudyPlan>): Promise<StudyPlan | null> {
    const plan = this.plans.get(id);
    if (!plan) return null;

    const updated = { ...plan, ...updates };
    this.plans.set(id, updated);
    await this.save();
    return updated;
  }

  async deletePlan(id: string): Promise<boolean> {
    const deleted = this.plans.delete(id);
    if (deleted) {
      await this.save();
    }
    return deleted;
  }

  async updatePlanProgress(id: string, progress: number): Promise<StudyPlan | null> {
    const plan = this.plans.get(id);
    if (!plan) return null;

    const capped = Math.min(Math.max(progress, 0), 100);
    const updated = { ...plan, progress: capped, completed: capped === 100 };
    this.plans.set(id, updated);
    await this.save();
    return updated;
  }

  // Quizzes
  async createQuiz(
    subject: string,
    title: string,
    description: string,
    questions: QuizQuestion[],
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ): Promise<Quiz> {
    const id = `quiz_${Date.now()}`;
    const estimatedTime = Math.ceil(questions.length * 1.5); // ~1.5 min per question

    const quiz: Quiz = {
      id,
      subject,
      title,
      description,
      questions,
      createdAt: Date.now(),
      difficulty,
      estimatedTime,
    };

    this.quizzes.set(id, quiz);
    await this.save();
    return quiz;
  }

  getQuiz(id: string): Quiz | undefined {
    return this.quizzes.get(id);
  }

  getQuizzes(): Quiz[] {
    return Array.from(this.quizzes.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  getQuizzesBySubject(subject: string): Quiz[] {
    return this.getQuizzes().filter(q => q.subject.toLowerCase() === subject.toLowerCase());
  }

  getQuizzesByDifficulty(difficulty: string): Quiz[] {
    return this.getQuizzes().filter(q => q.difficulty === difficulty);
  }

  async deleteQuiz(id: string): Promise<boolean> {
    const deleted = this.quizzes.delete(id);
    if (deleted) {
      await this.save();
    }
    return deleted;
  }

  // Quiz Attempts
  async startQuizAttempt(quizId: string): Promise<QuizAttempt> {
    const id = `attempt_${Date.now()}`;
    const attempt: QuizAttempt = {
      id,
      quizId,
      startedAt: Date.now(),
      answers: [],
      score: 0,
      timeSpent: 0,
    };

    this.attempts.set(id, attempt);
    await this.save();
    return attempt;
  }

  async recordAnswer(attemptId: string, questionIndex: number, answerIndex: number): Promise<QuizAttempt | null> {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) return null;

    attempt.answers[questionIndex] = answerIndex;
    this.attempts.set(attemptId, attempt);
    await this.save();
    return attempt;
  }

  async completeQuizAttempt(attemptId: string): Promise<QuizAttempt | null> {
    const attempt = this.attempts.get(attemptId);
    if (!attempt) return null;

    const quiz = this.quizzes.get(attempt.quizId);
    if (!quiz) return null;

    const timeSpent = Math.floor((Date.now() - attempt.startedAt) / 1000);
    let correctCount = 0;

    attempt.answers.forEach((answerIndex, questionIndex) => {
      const question = quiz.questions[questionIndex];
      if (question && answerIndex === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / quiz.questions.length) * 100);

    const completed = {
      ...attempt,
      completedAt: Date.now(),
      score,
      timeSpent,
    };

    this.attempts.set(attemptId, completed);
    await this.save();
    return completed;
  }

  getAttempt(id: string): QuizAttempt | undefined {
    return this.attempts.get(id);
  }

  getAttempts(): QuizAttempt[] {
    return Array.from(this.attempts.values()).sort((a, b) => b.startedAt - a.startedAt);
  }

  getAttemptsByQuiz(quizId: string): QuizAttempt[] {
    return this.getAttempts().filter(a => a.quizId === quizId);
  }

  getCompletedAttempts(): QuizAttempt[] {
    return this.getAttempts().filter(a => a.completedAt !== undefined);
  }

  getAverageQuizScore(quizId?: string): number {
    const attempts = quizId
      ? this.getAttemptsByQuiz(quizId).filter(a => a.completedAt)
      : this.getCompletedAttempts();

    if (attempts.length === 0) return 0;
    const sum = attempts.reduce((acc, a) => acc + a.score, 0);
    return Math.round(sum / attempts.length);
  }

  // Recommendations
  async generateRecommendation(
    subject: string,
    title: string,
    reason: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    suggestedDuration: number = 30
  ): Promise<StudyRecommendation> {
    const id = `rec_${Date.now()}`;
    const recommendation: StudyRecommendation = {
      id,
      subject,
      title,
      reason,
      priority,
      suggestedDuration,
      createdAt: Date.now(),
    };

    this.recommendations.set(id, recommendation);
    await this.save();
    return recommendation;
  }

  getRecommendations(): StudyRecommendation[] {
    return Array.from(this.recommendations.values())
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  getRecommendationsBySubject(subject: string): StudyRecommendation[] {
    return this.getRecommendations().filter(r => r.subject.toLowerCase() === subject.toLowerCase());
  }

  async deleteRecommendation(id: string): Promise<boolean> {
    const deleted = this.recommendations.delete(id);
    if (deleted) {
      await this.save();
    }
    return deleted;
  }

  // Statistics
  getTotalPlansCompleted(): number {
    return this.getCompletedPlans().length;
  }

  getTotalQuizzesTaken(): number {
    return this.getCompletedAttempts().length;
  }

  getAverageQuizScoreOverall(): number {
    return this.getAverageQuizScore();
  }

  getStudyStreak(): number {
    // Calculate based on plan completion dates
    const completed = this.getCompletedPlans().sort((a, b) => b.createdAt - a.createdAt);
    if (completed.length === 0) return 0;

    let streak = 0;
    const today = new Date().toDateString();

    for (const plan of completed) {
      const planDate = new Date(plan.createdAt).toDateString();
      const expectedDate = new Date(Date.now() - streak * 86400000).toDateString();

      if (planDate === expectedDate || (streak === 0 && planDate === today)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Data Management
  async clearAll() {
    this.plans.clear();
    this.quizzes.clear();
    this.attempts.clear();
    this.recommendations.clear();

    await Promise.all([
      AsyncStorage.removeItem(PLANS_KEY),
      AsyncStorage.removeItem(QUIZZES_KEY),
      AsyncStorage.removeItem(ATTEMPTS_KEY),
      AsyncStorage.removeItem(RECOMMENDATIONS_KEY),
    ]);
  }

  private async save() {
    try {
      const plansArray = Array.from(this.plans.entries());
      const quizzesArray = Array.from(this.quizzes.entries());
      const attemptsArray = Array.from(this.attempts.entries());
      const recommendationsArray = Array.from(this.recommendations.entries());

      await Promise.all([
        AsyncStorage.setItem(PLANS_KEY, JSON.stringify(plansArray)),
        AsyncStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzesArray)),
        AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attemptsArray)),
        AsyncStorage.setItem(RECOMMENDATIONS_KEY, JSON.stringify(recommendationsArray)),
      ]);
    } catch (error) {
      console.error('Error saving planner data:', error);
    }
  }
}

export const plannerService = new PlannerService();
