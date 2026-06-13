/**
 * Subject Service
 * 
 * Manages subject data including colors, names, and custom subjects
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Subject {
  id: number;
  name: string;
  color: string;
  isCustom: boolean;
  createdAt?: string;
}

class SubjectService {
  private subjects: Subject[] = [];
  private nextCustomId = 1000;
  private storageKey = "subjects";
  private defaultSubjects: Subject[] = [
    { id: 1, name: "Quantitative Aptitude", color: "#FF6B6B", isCustom: false },
    { id: 2, name: "Reasoning", color: "#A78BFA", isCustom: false },
    { id: 3, name: "English", color: "#06B6D4", isCustom: false },
    { id: 4, name: "Banking Awareness", color: "#FBBF24", isCustom: false },
    { id: 5, name: "General Awareness", color: "#60A5FA", isCustom: false },
    { id: 6, name: "Social Issues", color: "#FB7185", isCustom: false },
    { id: 7, name: "Finance", color: "#F3F4F6", isCustom: false },
    { id: 8, name: "General Management", color: "#C084FC", isCustom: false },
    { id: 9, name: "Accountancy", color: "#34D399", isCustom: false },
    { id: 10, name: "Motivation", color: "#EC4899", isCustom: false },
  ];

  /**
   * Initialize subject service
   */
  async initialize(): Promise<void> {
    await this.loadSubjects();
    if (this.subjects.length === 0) {
      this.subjects = [...this.defaultSubjects];
      await this.saveSubjects();
    }
  }

  /**
   * Load subjects from AsyncStorage
   */
  private async loadSubjects(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        this.subjects = JSON.parse(stored);
        // Update nextCustomId based on existing custom subjects
        const customIds = this.subjects
          .filter((s) => s.isCustom)
          .map((s) => s.id)
          .sort((a, b) => b - a);
        if (customIds.length > 0) {
          this.nextCustomId = customIds[0] + 1;
        }
      }
    } catch (error) {
      console.error("Failed to load subjects:", error);
    }
  }

  /**
   * Save subjects to AsyncStorage
   */
  private async saveSubjects(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.subjects));
    } catch (error) {
      console.error("Failed to save subjects:", error);
    }
  }

  /**
   * Get all subjects
   */
  getSubjects(): Subject[] {
    return [...this.subjects];
  }

  /**
   * Get subject by ID
   */
  getSubject(id: number): Subject | undefined {
    return this.subjects.find((s) => s.id === id);
  }

  /**
   * Add a new subject
   */
  async addSubject(name: string, color: string): Promise<Subject> {
    const subject: Subject = {
      id: this.nextCustomId++,
      name,
      color,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    this.subjects.push(subject);
    await this.saveSubjects();
    return subject;
  }

  /**
   * Update a subject
   */
  async updateSubject(id: number, updates: Partial<Subject>): Promise<Subject | null> {
    const subject = this.subjects.find((s) => s.id === id);
    if (!subject) return null;

    Object.assign(subject, updates);
    await this.saveSubjects();
    return subject;
  }

  /**
   * Delete a subject (only custom subjects can be deleted)
   */
  async deleteSubject(id: number): Promise<boolean> {
    const subject = this.subjects.find((s) => s.id === id);
    if (!subject || !subject.isCustom) return false;

    this.subjects = this.subjects.filter((s) => s.id !== id);
    await this.saveSubjects();
    return true;
  }

  /**
   * Reorder subjects
   */
  async reorderSubjects(orderedIds: number[]): Promise<void> {
    const orderedSubjects: Subject[] = [];
    for (const id of orderedIds) {
      const subject = this.subjects.find((s) => s.id === id);
      if (subject) {
        orderedSubjects.push(subject);
      }
    }
    this.subjects = orderedSubjects;
    await this.saveSubjects();
  }

  /**
   * Reset to default subjects
   */
  async resetToDefaults(): Promise<void> {
    this.subjects = [...this.defaultSubjects];
    this.nextCustomId = 1000;
    await this.saveSubjects();
  }

  /**
   * Get color for a subject
   */
  getSubjectColor(subjectId: number): string {
    const subject = this.getSubject(subjectId);
    return subject?.color || "#9BA1A6";
  }

  /**
   * Get name for a subject
   */
  getSubjectName(subjectId: number): string {
    const subject = this.getSubject(subjectId);
    return subject?.name || "Unknown";
  }
}

// Export singleton instance
export const subjectService = new SubjectService();
