/**
 * Distraction Audit Report Service
 * 
 * Analyzes user background activity to generate weekly focus audits
 * Identifies distraction patterns and triggers
 */

export type DistractionCategory =
  | 'social-media'
  | 'messaging'
  | 'entertainment'
  | 'productivity'
  | 'other';

export interface DistractionEvent {
  timestamp: number;
  appName: string;
  category: DistractionCategory;
  duration: number; // in seconds
  sessionId: string;
}

export interface TimeSlotAnalysis {
  hour: number; // 0-23
  distractionCount: number;
  totalDuration: number; // in seconds
  avgIntensity: number;
  topDistractions: string[];
}

export interface DistractionPattern {
  timeOfDay: string; // e.g., "4 PM"
  dayOfWeek: string; // e.g., "Tuesday"
  app: string; // e.g., "Instagram"
  frequency: number; // times per week
  avgDuration: number; // in seconds
  impact: 'high' | 'medium' | 'low';
}

export interface FocusAudit {
  weekStartDate: number; // timestamp
  weekEndDate: number; // timestamp
  totalSessions: number;
  totalFocusTime: number; // in seconds
  totalDistractionTime: number; // in seconds
  avgIntensity: number;
  distractionRate: number; // percentage
  topDistractions: string[];
  patterns: DistractionPattern[];
  recommendations: string[];
  score: number; // 0-100
}

/**
 * Distraction Audit Service
 */
export class DistractionAuditService {
  private distractionEvents: DistractionEvent[] = [];

  /**
   * Categorize app by name
   */
  private categorizeApp(appName: string): DistractionCategory {
    const socialMedia = [
      'instagram',
      'facebook',
      'twitter',
      'tiktok',
      'snapchat',
      'reddit',
    ];
    const messaging = ['whatsapp', 'telegram', 'messenger', 'signal', 'discord'];
    const entertainment = ['youtube', 'netflix', 'spotify', 'games'];

    const lowerName = appName.toLowerCase();

    if (socialMedia.some((app) => lowerName.includes(app))) {
      return 'social-media';
    }
    if (messaging.some((app) => lowerName.includes(app))) {
      return 'messaging';
    }
    if (entertainment.some((app) => lowerName.includes(app))) {
      return 'entertainment';
    }

    return 'other';
  }

  /**
   * Record a distraction event
   */
  recordDistractionEvent(
    appName: string,
    duration: number,
    sessionId: string
  ): void {
    const event: DistractionEvent = {
      timestamp: Date.now(),
      appName,
      category: this.categorizeApp(appName),
      duration,
      sessionId,
    };

    this.distractionEvents.push(event);
  }

  /**
   * Get distraction events for a time range
   */
  private getEventsInRange(startTime: number, endTime: number): DistractionEvent[] {
    return this.distractionEvents.filter(
      (event) => event.timestamp >= startTime && event.timestamp <= endTime
    );
  }

  /**
   * Analyze time slots for distraction patterns
   */
  private analyzeTimeSlots(
    events: DistractionEvent[]
  ): Map<number, TimeSlotAnalysis> {
    const slots = new Map<number, TimeSlotAnalysis>();

    events.forEach((event) => {
      const date = new Date(event.timestamp);
      const hour = date.getHours();

      if (!slots.has(hour)) {
        slots.set(hour, {
          hour,
          distractionCount: 0,
          totalDuration: 0,
          avgIntensity: 0,
          topDistractions: [],
        });
      }

      const slot = slots.get(hour)!;
      slot.distractionCount++;
      slot.totalDuration += event.duration;
    });

    // Calculate top distractions per slot
    slots.forEach((slot) => {
      const slotEvents = events.filter((e) => {
        const date = new Date(e.timestamp);
        return date.getHours() === slot.hour;
      });

      const appCounts = new Map<string, number>();
      slotEvents.forEach((e) => {
        appCounts.set(e.appName, (appCounts.get(e.appName) || 0) + 1);
      });

      slot.topDistractions = Array.from(appCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((entry) => entry[0]);
    });

    return slots;
  }

  /**
   * Identify distraction patterns
   */
  private identifyPatterns(events: DistractionEvent[]): DistractionPattern[] {
    const patterns: DistractionPattern[] = [];
    const patternMap = new Map<string, DistractionEvent[]>();

    // Group events by hour and app
    events.forEach((event) => {
      const date = new Date(event.timestamp);
      const hour = date.getHours();
      const key = `${hour}-${event.appName}`;

      if (!patternMap.has(key)) {
        patternMap.set(key, []);
      }
      patternMap.get(key)!.push(event);
    });

    // Analyze patterns
    patternMap.forEach((patternEvents, key) => {
      const [hour, app] = key.split('-');
      const hourNum = parseInt(hour);

      if (patternEvents.length >= 2) {
        // Only report patterns with 2+ occurrences
        const avgDuration =
          patternEvents.reduce((sum, e) => sum + e.duration, 0) /
          patternEvents.length;
        const frequency = patternEvents.length; // per week

        // Determine impact
        let impact: 'high' | 'medium' | 'low' = 'low';
        if (avgDuration > 600) impact = 'high'; // > 10 minutes
        else if (avgDuration > 300) impact = 'medium'; // > 5 minutes

        patterns.push({
          timeOfDay: `${hourNum}:00`,
          dayOfWeek: 'Multiple', // simplified
          app,
          frequency,
          avgDuration,
          impact,
        });
      }
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    patterns: DistractionPattern[],
    distractionRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (distractionRate > 50) {
      recommendations.push(
        '🚨 Your distraction rate is very high. Consider enabling app blockers during focus sessions.'
      );
    } else if (distractionRate > 30) {
      recommendations.push(
        '⚠️ You lose focus frequently. Try using the "Do Not Disturb" mode during sessions.'
      );
    }

    // Top pattern recommendations
    patterns.slice(0, 2).forEach((pattern) => {
      if (pattern.impact === 'high') {
        recommendations.push(
          `📱 ${pattern.app} is your biggest distraction at ${pattern.timeOfDay}. Block it during focus sessions.`
        );
      }
    });

    if (recommendations.length === 0) {
      recommendations.push(
        '✅ Great focus habits! Keep maintaining your distraction-free sessions.'
      );
    }

    return recommendations;
  }

  /**
   * Calculate audit score (0-100)
   */
  private calculateScore(distractionRate: number, avgIntensity: number): number {
    // Score = (100 - distractionRate) * 0.6 + avgIntensity * 100 * 0.4
    const focusScore = (100 - Math.min(distractionRate, 100)) * 0.6;
    const intensityScore = avgIntensity * 100 * 0.4;

    return Math.round(focusScore + intensityScore);
  }

  /**
   * Generate weekly focus audit
   */
  generateWeeklyAudit(
    weekStartDate: number,
    weekEndDate: number,
    totalSessions: number,
    totalFocusTime: number,
    avgIntensity: number
  ): FocusAudit {
    const events = this.getEventsInRange(weekStartDate, weekEndDate);

    const totalDistractionTime = events.reduce((sum, e) => sum + e.duration, 0);
    const distractionRate =
      totalFocusTime > 0
        ? (totalDistractionTime / (totalFocusTime + totalDistractionTime)) * 100
        : 0;

    const timeSlots = this.analyzeTimeSlots(events);
    const topDistractions = Array.from(timeSlots.values())
      .flatMap((slot) => slot.topDistractions)
      .filter((app, index, self) => self.indexOf(app) === index)
      .slice(0, 5);

    const patterns = this.identifyPatterns(events);
    const recommendations = this.generateRecommendations(patterns, distractionRate);
    const score = this.calculateScore(distractionRate, avgIntensity);

    return {
      weekStartDate,
      weekEndDate,
      totalSessions,
      totalFocusTime,
      totalDistractionTime,
      avgIntensity,
      distractionRate,
      topDistractions,
      patterns,
      recommendations,
      score,
    };
  }

  /**
   * Clear distraction events (for testing)
   */
  clearEvents(): void {
    this.distractionEvents = [];
  }

  /**
   * Get all distraction events
   */
  getEvents(): DistractionEvent[] {
    return [...this.distractionEvents];
  }
}

/**
 * Singleton distraction audit service
 */
export const distractionAuditService = new DistractionAuditService();
