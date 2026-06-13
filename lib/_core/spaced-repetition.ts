/**
 * Spaced Repetition Integration
 * 
 * Post-session voice notes with AI-generated review schedules
 */

import { EventEmitter } from 'eventemitter3';

export interface ReviewItem {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  nextReviewDate: number;
  reviewCount: number;
  interval: number; // days
  easeFactor: number; // SM-2 algorithm
  lastReviewDate: number;
}

export interface SessionReview {
  sessionId: string;
  userId: string;
  voiceNote: string; // transcribed text
  topics: ReviewItem[];
  generatedAt: number;
  reviewSchedule: ScheduledReview[];
}

export interface ScheduledReview {
  topicId: string;
  topic: string;
  scheduledDate: number;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
}

/**
 * Spaced Repetition Service
 */
export class SpacedRepetition extends EventEmitter {
  private reviews: Map<string, SessionReview> = new Map();
  private reviewItems: Map<string, ReviewItem> = new Map();
  private scheduledReviews: ScheduledReview[] = [];

  constructor() {
    super();
  }

  /**
   * Create session review from voice note
   */
  createSessionReview(
    sessionId: string,
    userId: string,
    voiceNoteText: string
  ): SessionReview {
    // Parse voice note to extract topics
    const topics = this.extractTopics(voiceNoteText);

    const review: SessionReview = {
      sessionId,
      userId,
      voiceNote: voiceNoteText,
      topics: topics.map((topic) => this.createReviewItem(topic)),
      generatedAt: Date.now(),
      reviewSchedule: [],
    };

    // Generate review schedule
    review.reviewSchedule = this.generateReviewSchedule(review.topics);

    this.reviews.set(sessionId, review);

    // Add to scheduled reviews
    review.reviewSchedule.forEach((scheduled) => {
      this.scheduledReviews.push(scheduled);
    });

    this.emit('session-review-created', review);
    return review;
  }

  /**
   * Extract topics from voice note (simple keyword extraction)
   */
  private extractTopics(voiceNote: string): string[] {
    // Simple extraction - in production, use NLP
    const keywords = voiceNote
      .toLowerCase()
      .split(/[\s,;.!?]+/)
      .filter((word) => word.length > 3);

    // Remove duplicates and common words
    const commonWords = new Set([
      'that', 'this', 'with', 'from', 'have', 'been', 'were', 'about',
      'what', 'when', 'where', 'which', 'their', 'would', 'could',
    ]);

    return Array.from(new Set(keywords.filter((k) => !commonWords.has(k)))).slice(0, 5);
  }

  /**
   * Create review item
   */
  private createReviewItem(topic: string): ReviewItem {
    const item: ReviewItem = {
      id: `review-${Date.now()}-${Math.random()}`,
      topic,
      difficulty: 'medium',
      nextReviewDate: Date.now() + 1 * 24 * 60 * 60 * 1000, // 1 day
      reviewCount: 0,
      interval: 1,
      easeFactor: 2.5,
      lastReviewDate: Date.now(),
    };

    this.reviewItems.set(item.id, item);
    return item as ReviewItem;
  }

  /**
   * Generate review schedule using SM-2 algorithm
   */
  private generateReviewSchedule(topics: ReviewItem[]): ScheduledReview[] {
    const schedule: ScheduledReview[] = [];
    const now = Date.now();

    // SM-2 intervals: 1 day, 3 days, 7 days, 14 days, 30 days
    const intervals = [1, 3, 7, 14, 30];

    topics.forEach((topic, index) => {
      const interval = intervals[Math.min(index, intervals.length - 1)];
      const scheduledDate = now + interval * 24 * 60 * 60 * 1000;

      // Determine priority based on difficulty
      let priority: 'high' | 'medium' | 'low' = 'medium';
      if (topic.difficulty === 'hard') priority = 'high';
      if (topic.difficulty === 'easy') priority = 'low';

      schedule.push({
        topicId: topic.id,
        topic: topic.topic,
        scheduledDate,
        priority,
        estimatedTime: topic.difficulty === 'hard' ? 30 : 15,
      });
    });

    return schedule;
  }

  /**
   * Get today's reviews
   */
  getTodayReviews(): ScheduledReview[] {
    const now = Date.now();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.scheduledReviews.filter(
      (review) =>
        review.scheduledDate >= today.getTime() &&
        review.scheduledDate < tomorrow.getTime()
    );
  }

  /**
   * Get upcoming reviews (next 7 days)
   */
  getUpcomingReviews(days = 7): ScheduledReview[] {
    const now = Date.now();
    const future = now + days * 24 * 60 * 60 * 1000;

    return this.scheduledReviews
      .filter((review) => review.scheduledDate >= now && review.scheduledDate <= future)
      .sort((a, b) => a.scheduledDate - b.scheduledDate);
  }

  /**
   * Mark review as completed
   */
  completeReview(topicId: string, quality: number): ReviewItem | null {
    const item = this.reviewItems.get(topicId);
    if (!item) return null;

    // SM-2 algorithm update
    item.reviewCount += 1;

    // Update ease factor
    item.easeFactor = Math.max(
      1.3,
      item.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    );

    // Calculate next interval
    if (item.reviewCount === 1) {
      item.interval = 1;
    } else if (item.reviewCount === 2) {
      item.interval = 3;
    } else {
      item.interval = Math.round(item.interval * item.easeFactor);
    }

    item.lastReviewDate = Date.now();
    item.nextReviewDate = Date.now() + item.interval * 24 * 60 * 60 * 1000;

    // Remove from scheduled reviews
    this.scheduledReviews = this.scheduledReviews.filter(
      (r) => r.topicId !== topicId
    );

    // Add new scheduled review
    this.scheduledReviews.push({
      topicId,
      topic: item.topic,
      scheduledDate: item.nextReviewDate,
      priority: item.difficulty === 'hard' ? 'high' : 'medium',
      estimatedTime: 15,
    });

    this.emit('review-completed', item);
    return item;
  }

  /**
   * Update topic difficulty
   */
  updateDifficulty(
    topicId: string,
    difficulty: 'easy' | 'medium' | 'hard'
  ): ReviewItem | null {
    const item = this.reviewItems.get(topicId);
    if (item) {
      item.difficulty = difficulty;
      this.emit('difficulty-updated', item);
      return item;
    }
    return null;
  }

  /**
   * Get review statistics
   */
  getStatistics(): {
    totalReviews: number;
    completedReviews: number;
    pendingReviews: number;
    averageEaseFactor: number;
  } {
    const items = Array.from(this.reviewItems.values());
    const completed = items.filter((i) => i.reviewCount > 0);

    return {
      totalReviews: items.length,
      completedReviews: completed.length,
      pendingReviews: this.getTodayReviews().length,
      averageEaseFactor:
        completed.length > 0
          ? completed.reduce((sum, i) => sum + i.easeFactor, 0) / completed.length
          : 0,
    };
  }

  /**
   * Get session review
   */
  getSessionReview(sessionId: string): SessionReview | null {
    return this.reviews.get(sessionId) ?? null;
  }

  /**
   * Get all session reviews for user
   */
  getUserReviews(userId: string): SessionReview[] {
    return Array.from(this.reviews.values()).filter((r) => r.userId === userId);
  }

  /**
   * Delete review item
   */
  deleteReviewItem(topicId: string): void {
    this.reviewItems.delete(topicId);
    this.scheduledReviews = this.scheduledReviews.filter(
      (r) => r.topicId !== topicId
    );
    this.emit('review-deleted', topicId);
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.removeAllListeners();
  }
}

/**
 * Singleton spaced repetition
 */
let globalSpacedRepetition: SpacedRepetition | null = null;

export function getGlobalSpacedRepetition(): SpacedRepetition {
  if (!globalSpacedRepetition) {
    globalSpacedRepetition = new SpacedRepetition();
  }
  return globalSpacedRepetition;
}

export function resetGlobalSpacedRepetition(): void {
  if (globalSpacedRepetition) {
    globalSpacedRepetition.destroy();
    globalSpacedRepetition = null;
  }
}
