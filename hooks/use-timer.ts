/**
 * useTimer Hook
 * 
 * Provides access to timer service and reactive updates
 */

import { useEffect, useState, useCallback } from "react";
import { timerService, TimerState, SubjectStats, TimerSession } from "@/lib/timer-service";

export function useTimer() {
  const [timerState, setTimerState] = useState<TimerState>(timerService.getTimerState());
  const [activeSession, setActiveSession] = useState<TimerSession | undefined>(
    timerService.getActiveSession()
  );

  // Update timer display every 100ms when running
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerState(timerService.getTimerState());
      setActiveSession(timerService.getActiveSession());
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const startSession = useCallback(async (subjectId: number) => {
    await timerService.startSession(subjectId);
    setTimerState(timerService.getTimerState());
    setActiveSession(timerService.getActiveSession());
  }, []);

  const pauseSession = useCallback(async () => {
    await timerService.pauseSession();
    setTimerState(timerService.getTimerState());
    setActiveSession(timerService.getActiveSession());
  }, []);

  const resumeSession = useCallback(async () => {
    await timerService.resumeSession();
    setTimerState(timerService.getTimerState());
    setActiveSession(timerService.getActiveSession());
  }, []);

  const stopSession = useCallback(async () => {
    await timerService.stopSession();
    setTimerState(timerService.getTimerState());
    setActiveSession(timerService.getActiveSession());
  }, []);

  const getSubjectStats = useCallback((subjectId: number): SubjectStats => {
    return timerService.getSubjectStats(subjectId);
  }, []);

  const getTotalStudyTime = useCallback((): number => {
    return timerService.getTotalStudyTime();
  }, []);

  return {
    timerState,
    activeSession,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    getSubjectStats,
    getTotalStudyTime,
  };
}
