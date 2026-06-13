/**
 * Service Initializer
 *
 * Coordinates initialization of all singleton services on app boot.
 * Ensures each service is initialized exactly once.
 */

import { timerService } from "./timer-service";
import { subjectService } from "./subject-service";
import { statisticsService } from "./statistics-service";
import { plannerService } from "./planner-service";
import { bookService } from "./book-service";

let initialized = false;
let initPromise: Promise<void> | null = null;

/**
 * Initialize all core services. Safe to call multiple times —
 * subsequent calls return the same promise.
 */
export async function initializeServices(): Promise<void> {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await Promise.all([
        timerService.initialize(),
        subjectService.initialize(),
        statisticsService.initialize(),
        plannerService.initialize(),
        bookService.initialize(),
      ]);
      initialized = true;
      console.log("[ServiceInit] All services initialized successfully");
    } catch (error) {
      console.error("[ServiceInit] Failed to initialize services:", error);
      initPromise = null; // Allow retry on failure
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Check if all services have been initialized.
 */
export function areServicesReady(): boolean {
  return initialized;
}
