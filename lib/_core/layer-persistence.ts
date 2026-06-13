/**
 * Layer Persistence Service
 * 
 * Auto-save layer synchronization with independent serialization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCanvasLayersStore } from '@/lib/stores/canvas-layers-store';

const LAYER_STATE_KEY = 'flowfocus_canvas_layers';
const LAYER_BACKUP_KEY = 'flowfocus_canvas_layers_backup';
const LAYER_SYNC_INTERVAL = 5000; // Auto-save every 5 seconds

export class LayerPersistenceService {
  private static instance: LayerPersistenceService;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private lastSyncTime: number = 0;
  private isDirty: boolean = false;

  private constructor() {}

  static getInstance(): LayerPersistenceService {
    if (!LayerPersistenceService.instance) {
      LayerPersistenceService.instance = new LayerPersistenceService();
    }
    return LayerPersistenceService.instance;
  }

  /**
   * Initialize persistence service
   */
  async initialize(): Promise<void> {
    // Restore layer state on app start
    await this.restoreLayerState();

    // Start auto-save interval
    this.startAutoSave();

    // Subscribe to store changes
    this.subscribeToStoreChanges();
  }

  /**
   * Subscribe to store changes
   */
  private subscribeToStoreChanges(): void {
    const store = useCanvasLayersStore;

    // Subscribe to any changes in layers
    store.subscribe(
      (state) => state.layers,
      () => {
        this.isDirty = true;
      }
    );
  }

  /**
   * Start auto-save interval
   */
  private startAutoSave(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isDirty) {
        this.saveLayerState().catch((error) => {
          console.error('Auto-save failed:', error);
        });
      }
    }, LAYER_SYNC_INTERVAL);
  }

  /**
   * Save layer state to AsyncStorage
   */
  async saveLayerState(): Promise<void> {
    try {
      const store = useCanvasLayersStore.getState();
      const layerState = store.saveLayerState();

      // Save current state
      await AsyncStorage.setItem(LAYER_STATE_KEY, layerState);

      // Also save backup
      const previousState = await AsyncStorage.getItem(LAYER_STATE_KEY);
      if (previousState) {
        await AsyncStorage.setItem(LAYER_BACKUP_KEY, previousState);
      }

      this.lastSyncTime = Date.now();
      this.isDirty = false;
    } catch (error) {
      console.error('Error saving layer state:', error);
      throw error;
    }
  }

  /**
   * Restore layer state from AsyncStorage
   */
  async restoreLayerState(): Promise<void> {
    try {
      const store = useCanvasLayersStore.getState();
      const savedState = await AsyncStorage.getItem(LAYER_STATE_KEY);

      if (savedState) {
        store.restoreLayerState(savedState);
      }
    } catch (error) {
      console.error('Error restoring layer state:', error);
      // Try to restore from backup
      await this.restoreFromBackup();
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(): Promise<void> {
    try {
      const store = useCanvasLayersStore.getState();
      const backupState = await AsyncStorage.getItem(LAYER_BACKUP_KEY);

      if (backupState) {
        store.restoreLayerState(backupState);
      } else {
        // Reset to defaults if no backup available
        store.resetLayers();
      }
    } catch (error) {
      console.error('Error restoring from backup:', error);
      useCanvasLayersStore.getState().resetLayers();
    }
  }

  /**
   * Clear all saved layer states
   */
  async clearLayerState(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([LAYER_STATE_KEY, LAYER_BACKUP_KEY]);
    } catch (error) {
      console.error('Error clearing layer state:', error);
    }
  }

  /**
   * Export layer state as JSON
   */
  async exportLayerState(): Promise<string> {
    const store = useCanvasLayersStore.getState();
    return store.saveLayerState();
  }

  /**
   * Import layer state from JSON
   */
  async importLayerState(stateJson: string): Promise<void> {
    try {
      const store = useCanvasLayersStore.getState();
      store.restoreLayerState(stateJson);
      await this.saveLayerState();
    } catch (error) {
      console.error('Error importing layer state:', error);
      throw error;
    }
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  /**
   * Check if state is dirty
   */
  isDirtyState(): boolean {
    return this.isDirty;
  }

  /**
   * Force immediate save
   */
  async forceSave(): Promise<void> {
    this.isDirty = true;
    await this.saveLayerState();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    currentSize: number;
    backupSize: number;
    lastSyncTime: number;
  }> {
    try {
      const current = await AsyncStorage.getItem(LAYER_STATE_KEY);
      const backup = await AsyncStorage.getItem(LAYER_BACKUP_KEY);

      return {
        currentSize: current ? current.length : 0,
        backupSize: backup ? backup.length : 0,
        lastSyncTime: this.lastSyncTime,
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        currentSize: 0,
        backupSize: 0,
        lastSyncTime: 0,
      };
    }
  }
}

// Global instance
let globalLayerPersistenceService: LayerPersistenceService | null = null;

export function getGlobalLayerPersistenceService(): LayerPersistenceService {
  if (!globalLayerPersistenceService) {
    globalLayerPersistenceService = LayerPersistenceService.getInstance();
  }
  return globalLayerPersistenceService;
}

export async function initializeLayerPersistence(): Promise<void> {
  const service = getGlobalLayerPersistenceService();
  await service.initialize();
}
