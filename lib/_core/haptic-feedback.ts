/**
 * Haptic Feedback Service
 * 
 * Provides haptic patterns for:
 * - Session start
 * - Session break
 * - Distraction alerts
 * - Session complete
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticPattern = 'start' | 'break' | 'distraction' | 'complete' | 'success' | 'warning' | 'error';

/**
 * Haptic Feedback Service
 */
export class HapticFeedbackService {
  private isEnabled: boolean = true;
  private isSupported: boolean = Platform.OS !== 'web';

  /**
   * Enable/disable haptic feedback
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Check if haptics are supported
   */
  isHapticsSupported(): boolean {
    return this.isSupported && this.isEnabled;
  }

  /**
   * Trigger session start haptic
   * Pattern: Light double tap
   */
  async triggerSessionStart() {
    if (!this.isHapticsSupported()) return;

    try {
      // Light double tap
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger break haptic
   * Pattern: Medium single tap
   */
  async triggerBreak() {
    if (!this.isHapticsSupported()) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger distraction alert haptic
   * Pattern: Warning - rapid light taps
   */
  async triggerDistractionAlert() {
    if (!this.isHapticsSupported()) return;

    try {
      // Rapid light taps
      for (let i = 0; i < 3; i++) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger session complete haptic
   * Pattern: Success - medium tap followed by light tap
   */
  async triggerSessionComplete() {
    if (!this.isHapticsSupported()) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await new Promise((resolve) => setTimeout(resolve, 100));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger success notification
   */
  async triggerSuccess() {
    if (!this.isHapticsSupported()) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger warning notification
   */
  async triggerWarning() {
    if (!this.isHapticsSupported()) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger error notification
   */
  async triggerError() {
    if (!this.isHapticsSupported()) return;

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger custom haptic pattern
   */
  async triggerPattern(pattern: HapticPattern) {
    switch (pattern) {
      case 'start':
        await this.triggerSessionStart();
        break;
      case 'break':
        await this.triggerBreak();
        break;
      case 'distraction':
        await this.triggerDistractionAlert();
        break;
      case 'complete':
        await this.triggerSessionComplete();
        break;
      case 'success':
        await this.triggerSuccess();
        break;
      case 'warning':
        await this.triggerWarning();
        break;
      case 'error':
        await this.triggerError();
        break;
    }
  }

  /**
   * Trigger light tap (generic)
   */
  async triggerLight() {
    if (!this.isHapticsSupported()) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger medium tap (generic)
   */
  async triggerMedium() {
    if (!this.isHapticsSupported()) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger heavy tap (generic)
   */
  async triggerHeavy() {
    if (!this.isHapticsSupported()) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }
}

/**
 * Singleton haptic feedback instance
 */
export const hapticFeedback = new HapticFeedbackService();

/**
 * Hook for using haptic feedback in components
 */
export function useHapticFeedback() {
  return {
    triggerSessionStart: () => hapticFeedback.triggerSessionStart(),
    triggerBreak: () => hapticFeedback.triggerBreak(),
    triggerDistractionAlert: () => hapticFeedback.triggerDistractionAlert(),
    triggerSessionComplete: () => hapticFeedback.triggerSessionComplete(),
    triggerSuccess: () => hapticFeedback.triggerSuccess(),
    triggerWarning: () => hapticFeedback.triggerWarning(),
    triggerError: () => hapticFeedback.triggerError(),
    triggerPattern: (pattern: HapticPattern) => hapticFeedback.triggerPattern(pattern),
  };
}
