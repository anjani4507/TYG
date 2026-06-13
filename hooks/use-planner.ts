import { useEffect, useState } from 'react';
import {
  plannerService,
  StudyPlan,
  Quiz,
  QuizAttempt,
  StudyRecommendation,
} from '@/lib/planner-service';

export function usePlanner() {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAndLoad();
  }, []);

  const initializeAndLoad = async () => {
    try {
      await plannerService.initialize();
      const p = plannerService.getPlans();
      const q = plannerService.getQuizzes();
      const a = plannerService.getAttempts();
      const r = plannerService.getRecommendations();

      setPlans(p);
      setQuizzes(q);
      setAttempts(a);
      setRecommendations(r);
    } catch (error) {
      console.error('Error loading planner:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (
    subject: string,
    title: string,
    description: string,
    durationMinutes: number,
    topics: string[],
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ) => {
    try {
      await plannerService.createPlan(subject, title, description, durationMinutes, topics, difficulty);
      const p = plannerService.getPlans();
      setPlans(p);
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  const updatePlanProgress = async (id: string, progress: number) => {
    try {
      await plannerService.updatePlanProgress(id, progress);
      const p = plannerService.getPlans();
      setPlans(p);
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const deletePlan = async (id: string) => {
    try {
      await plannerService.deletePlan(id);
      const p = plannerService.getPlans();
      setPlans(p);
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const createQuiz = async (
    subject: string,
    title: string,
    description: string,
    questions: any[],
    difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
  ) => {
    try {
      await plannerService.createQuiz(subject, title, description, questions, difficulty);
      const q = plannerService.getQuizzes();
      setQuizzes(q);
    } catch (error) {
      console.error('Error creating quiz:', error);
    }
  };

  const startQuizAttempt = async (quizId: string) => {
    try {
      const attempt = await plannerService.startQuizAttempt(quizId);
      const a = plannerService.getAttempts();
      setAttempts(a);
      return attempt;
    } catch (error) {
      console.error('Error starting quiz:', error);
      return null;
    }
  };

  const recordAnswer = async (attemptId: string, questionIndex: number, answerIndex: number) => {
    try {
      await plannerService.recordAnswer(attemptId, questionIndex, answerIndex);
      const a = plannerService.getAttempts();
      setAttempts(a);
    } catch (error) {
      console.error('Error recording answer:', error);
    }
  };

  const completeQuizAttempt = async (attemptId: string) => {
    try {
      const completed = await plannerService.completeQuizAttempt(attemptId);
      const a = plannerService.getAttempts();
      setAttempts(a);
      return completed;
    } catch (error) {
      console.error('Error completing quiz:', error);
      return null;
    }
  };

  const generateRecommendation = async (
    subject: string,
    title: string,
    reason: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    suggestedDuration: number = 30
  ) => {
    try {
      await plannerService.generateRecommendation(subject, title, reason, priority, suggestedDuration);
      const r = plannerService.getRecommendations();
      setRecommendations(r);
    } catch (error) {
      console.error('Error generating recommendation:', error);
    }
  };

  const refresh = async () => {
    await initializeAndLoad();
  };

  return {
    plans,
    quizzes,
    attempts,
    recommendations,
    loading,
    createPlan,
    updatePlanProgress,
    deletePlan,
    createQuiz,
    startQuizAttempt,
    recordAnswer,
    completeQuizAttempt,
    generateRecommendation,
    refresh,
  };
}
