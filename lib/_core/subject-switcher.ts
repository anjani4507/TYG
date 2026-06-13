/**
 * Quick-Tap Subject Switcher
 * 
 * Sub-1 second subject/task switching with haptic feedback
 */

import { EventEmitter } from 'eventemitter3';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
  lastUsed: number;
  sessionCount: number;
}

export interface SwitchEvent {
  fromSubject: Subject | null;
  toSubject: Subject;
  timestamp: number;
  switchTime: number; // milliseconds
}

/**
 * Subject Switcher Service
 */
export class SubjectSwitcher extends EventEmitter {
  private subjects: Map<string, Subject> = new Map();
  private currentSubject: Subject | null = null;
  private recentSubjects: string[] = [];
  private maxRecentSubjects = 5;
  private lastSwitchTime = 0;

  constructor() {
    super();
    this.initializeDefaultSubjects();
  }

  /**
   * Initialize default subjects
   */
  private initializeDefaultSubjects(): void {
    const defaults: Subject[] = [
      {
        id: 'math',
        name: 'Mathematics',
        color: '#3B82F6',
        icon: '∑',
        lastUsed: 0,
        sessionCount: 0,
      },
      {
        id: 'physics',
        name: 'Physics',
        color: '#EF4444',
        icon: '⚛',
        lastUsed: 0,
        sessionCount: 0,
      },
      {
        id: 'chemistry',
        name: 'Chemistry',
        color: '#8B5CF6',
        icon: '⚗',
        lastUsed: 0,
        sessionCount: 0,
      },
      {
        id: 'biology',
        name: 'Biology',
        color: '#10B981',
        icon: '🧬',
        lastUsed: 0,
        sessionCount: 0,
      },
      {
        id: 'english',
        name: 'English',
        color: '#F59E0B',
        icon: '📚',
        lastUsed: 0,
        sessionCount: 0,
      },
      {
        id: 'history',
        name: 'History',
        color: '#6366F1',
        icon: '📜',
        lastUsed: 0,
        sessionCount: 0,
      },
      {
        id: 'geography',
        name: 'Geography',
        color: '#06B6D4',
        icon: '🌍',
        lastUsed: 0,
        sessionCount: 0,
      },
      {
        id: 'coding',
        name: 'Coding',
        color: '#14B8A6',
        icon: '💻',
        lastUsed: 0,
        sessionCount: 0,
      },
    ];

    defaults.forEach((subject) => {
      this.subjects.set(subject.id, subject);
    });
  }

  /**
   * Switch to subject (sub-1 second operation)
   */
  switchToSubject(subjectId: string): SwitchEvent | null {
    const startTime = Date.now();
    const subject = this.subjects.get(subjectId);

    if (!subject) {
      console.warn(`Subject ${subjectId} not found`);
      return null;
    }

    const fromSubject = this.currentSubject;
    this.currentSubject = subject;

    // Update last used timestamp
    subject.lastUsed = Date.now();
    subject.sessionCount += 1;

    // Track in recent subjects
    this.recentSubjects = this.recentSubjects.filter((id) => id !== subjectId);
    this.recentSubjects.unshift(subjectId);
    if (this.recentSubjects.length > this.maxRecentSubjects) {
      this.recentSubjects.pop();
    }

    const switchTime = Date.now() - startTime;

    // Haptic feedback (light tap)
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const event: SwitchEvent = {
      fromSubject,
      toSubject: subject,
      timestamp: Date.now(),
      switchTime,
    };

    this.emit('subject-switched', event);
    return event;
  }

  /**
   * Get current subject
   */
  getCurrentSubject(): Subject | null {
    return this.currentSubject;
  }

  /**
   * Get all subjects
   */
  getSubjects(): Subject[] {
    return Array.from(this.subjects.values());
  }

  /**
   * Get recent subjects (for quick access)
   */
  getRecentSubjects(): Subject[] {
    return this.recentSubjects
      .map((id) => this.subjects.get(id))
      .filter((s): s is Subject => s !== undefined);
  }

  /**
   * Add custom subject
   */
  addSubject(subject: Subject): void {
    this.subjects.set(subject.id, subject);
    this.emit('subject-added', subject);
  }

  /**
   * Remove subject
   */
  removeSubject(subjectId: string): void {
    this.subjects.delete(subjectId);
    if (this.currentSubject?.id === subjectId) {
      this.currentSubject = null;
    }
    this.emit('subject-removed', subjectId);
  }

  /**
   * Update subject
   */
  updateSubject(subjectId: string, updates: Partial<Subject>): void {
    const subject = this.subjects.get(subjectId);
    if (subject) {
      const updated = { ...subject, ...updates };
      this.subjects.set(subjectId, updated);
      if (this.currentSubject?.id === subjectId) {
        this.currentSubject = updated;
      }
      this.emit('subject-updated', updated);
    }
  }

  /**
   * Get subject statistics
   */
  getStatistics(subjectId: string): {
    sessionCount: number;
    lastUsed: number;
    daysSinceUsed: number;
  } | null {
    const subject = this.subjects.get(subjectId);
    if (!subject) return null;

    const now = Date.now();
    const daysSinceUsed = Math.floor(
      (now - subject.lastUsed) / (1000 * 60 * 60 * 24)
    );

    return {
      sessionCount: subject.sessionCount,
      lastUsed: subject.lastUsed,
      daysSinceUsed,
    };
  }

  /**
   * Get most used subjects
   */
  getMostUsedSubjects(limit = 3): Subject[] {
    return Array.from(this.subjects.values())
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, limit);
  }

  /**
   * Reset all statistics
   */
  resetStatistics(): void {
    this.subjects.forEach((subject) => {
      subject.sessionCount = 0;
      subject.lastUsed = 0;
    });
    this.emit('statistics-reset');
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.removeAllListeners();
  }
}

/**
 * Singleton subject switcher
 */
let globalSubjectSwitcher: SubjectSwitcher | null = null;

export function getGlobalSubjectSwitcher(): SubjectSwitcher {
  if (!globalSubjectSwitcher) {
    globalSubjectSwitcher = new SubjectSwitcher();
  }
  return globalSubjectSwitcher;
}

export function resetGlobalSubjectSwitcher(): void {
  if (globalSubjectSwitcher) {
    globalSubjectSwitcher.destroy();
    globalSubjectSwitcher = null;
  }
}
