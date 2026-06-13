/**
 * useSubjects Hook
 * 
 * Provides access to subject management and reactive updates
 */

import { useEffect, useState, useCallback } from "react";
import { subjectService, Subject } from "@/lib/subject-service";

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize subjects on mount
  useEffect(() => {
    const initializeSubjects = async () => {
      setIsLoading(true);
      await subjectService.initialize();
      setSubjects(subjectService.getSubjects());
      setIsLoading(false);
    };

    initializeSubjects();
  }, []);

  const addSubject = useCallback(async (name: string, color: string) => {
    const subject = await subjectService.addSubject(name, color);
    setSubjects(subjectService.getSubjects());
    return subject;
  }, []);

  const updateSubject = useCallback(async (id: number, updates: Partial<Subject>) => {
    const subject = await subjectService.updateSubject(id, updates);
    setSubjects(subjectService.getSubjects());
    return subject;
  }, []);

  const deleteSubject = useCallback(async (id: number) => {
    const success = await subjectService.deleteSubject(id);
    if (success) {
      setSubjects(subjectService.getSubjects());
    }
    return success;
  }, []);

  const reorderSubjects = useCallback(async (orderedIds: number[]) => {
    await subjectService.reorderSubjects(orderedIds);
    setSubjects(subjectService.getSubjects());
  }, []);

  const resetToDefaults = useCallback(async () => {
    await subjectService.resetToDefaults();
    setSubjects(subjectService.getSubjects());
  }, []);

  const getSubject = useCallback((id: number) => {
    return subjectService.getSubject(id);
  }, []);

  const getSubjectColor = useCallback((id: number) => {
    return subjectService.getSubjectColor(id);
  }, []);

  const getSubjectName = useCallback((id: number) => {
    return subjectService.getSubjectName(id);
  }, []);

  return {
    subjects,
    isLoading,
    addSubject,
    updateSubject,
    deleteSubject,
    reorderSubjects,
    resetToDefaults,
    getSubject,
    getSubjectColor,
    getSubjectName,
  };
}
