/**
 * Theme Engine
 * 
 * Dynamic theme management with dark/light/system modes
 * and custom color support
 */

import { EventEmitter } from 'eventemitter3';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  customAccent?: string;
}

/**
 * Default Light Theme Colors
 */
const LIGHT_COLORS: ThemeColors = {
  primary: '#0a7ea4',
  secondary: '#1B9CFC',
  background: '#ffffff',
  surface: '#f5f5f5',
  foreground: '#11181C',
  muted: '#687076',
  border: '#E5E7EB',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
};

/**
 * Default Dark Theme Colors
 */
const DARK_COLORS: ThemeColors = {
  primary: '#0a7ea4',
  secondary: '#1B9CFC',
  background: '#151718',
  surface: '#1e2022',
  foreground: '#ECEDEE',
  muted: '#9BA1A6',
  border: '#334155',
  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
};

/**
 * Theme Engine Service
 */
export class ThemeEngine extends EventEmitter {
  private mode: ThemeMode = 'system';
  private customAccent: string | null = null;
  private systemDark: boolean = false;

  constructor() {
    super();
    this.updateSystemTheme();
  }

  /**
   * Update system theme detection
   */
  private updateSystemTheme(): void {
    // In a real app, this would use Appearance API
    // For now, default to light mode
    this.systemDark = false;
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    const isDark = this.mode === 'dark' || (this.mode === 'system' && this.systemDark);
    const baseColors = isDark ? DARK_COLORS : LIGHT_COLORS;

    // Apply custom accent if set
    const colors = { ...baseColors };
    if (this.customAccent) {
      colors.primary = this.customAccent;
    }

    return {
      mode: this.mode,
      isDark,
      colors,
      customAccent: this.customAccent || undefined,
    };
  }

  /**
   * Set theme mode
   */
  setMode(mode: ThemeMode): void {
    if (this.mode !== mode) {
      this.mode = mode;
      this.emit('theme-changed', this.getTheme());
    }
  }

  /**
   * Get current mode
   */
  getMode(): ThemeMode {
    return this.mode;
  }

  /**
   * Set custom accent color
   */
  setAccentColor(color: string): void {
    if (this.customAccent !== color) {
      this.customAccent = color;
      this.emit('theme-changed', this.getTheme());
    }
  }

  /**
   * Get custom accent color
   */
  getAccentColor(): string | null {
    return this.customAccent;
  }

  /**
   * Reset to default colors
   */
  resetToDefaults(): void {
    this.customAccent = null;
    this.emit('theme-changed', this.getTheme());
  }

  /**
   * Get light colors
   */
  getLightColors(): ThemeColors {
    return { ...LIGHT_COLORS };
  }

  /**
   * Get dark colors
   */
  getDarkColors(): ThemeColors {
    return { ...DARK_COLORS };
  }

  /**
   * Validate color contrast ratio
   */
  validateContrast(foreground: string, background: string): {
    ratio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  } {
    // Simplified contrast calculation
    // In production, use a proper contrast ratio library
    const fg = this.hexToRgb(foreground);
    const bg = this.hexToRgb(background);

    if (!fg || !bg) {
      return { ratio: 0, wcagAA: false, wcagAAA: false };
    }

    const fgLum = this.relativeLuminance(fg);
    const bgLum = this.relativeLuminance(bg);

    const lighter = Math.max(fgLum, bgLum);
    const darker = Math.min(fgLum, bgLum);

    const ratio = (lighter + 0.05) / (darker + 0.05);

    return {
      ratio: Math.round(ratio * 100) / 100,
      wcagAA: ratio >= 4.5, // AA standard
      wcagAAA: ratio >= 7, // AAA standard
    };
  }

  /**
   * Convert hex to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  /**
   * Calculate relative luminance
   */
  private relativeLuminance(rgb: { r: number; g: number; b: number }): number {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      const v = val / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Get all available theme presets
   */
  getPresets(): Array<{ name: string; accent: string }> {
    return [
      { name: 'Ocean Blue', accent: '#0a7ea4' },
      { name: 'Forest Green', accent: '#16a34a' },
      { name: 'Sunset Orange', accent: '#ea580c' },
      { name: 'Purple Haze', accent: '#9333ea' },
      { name: 'Rose Pink', accent: '#e11d48' },
      { name: 'Cyan', accent: '#06b6d4' },
      { name: 'Amber', accent: '#d97706' },
      { name: 'Slate', accent: '#64748b' },
    ];
  }

  /**
   * Destroy service
   */
  destroy(): void {
    this.removeAllListeners();
  }
}

/**
 * Singleton theme engine
 */
let globalThemeEngine: ThemeEngine | null = null;

export function getGlobalThemeEngine(): ThemeEngine {
  if (!globalThemeEngine) {
    globalThemeEngine = new ThemeEngine();
  }
  return globalThemeEngine;
}

export function resetGlobalThemeEngine(): void {
  if (globalThemeEngine) {
    globalThemeEngine.destroy();
    globalThemeEngine = null;
  }
}
