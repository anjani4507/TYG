import { describe, it, expect, beforeEach, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  completed: boolean;
  createdAt: string;
  subject?: string;
}

// Task management functions (same logic as in todo.tsx)
class TodoManager {
  private tasks: Task[] = [];

  async loadTasks(): Promise<Task[]> {
    try {
      const stored = await AsyncStorage.getItem("tasks");
      if (stored) {
        this.tasks = JSON.parse(stored);
      }
      return this.tasks;
    } catch (error) {
      console.error("Failed to load tasks:", error);
      return [];
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      await AsyncStorage.setItem("tasks", JSON.stringify(tasks));
      this.tasks = tasks;
    } catch (error) {
      console.error("Failed to save tasks:", error);
    }
  }

  async addTask(task: Omit<Task, "id" | "createdAt">): Promise<Task> {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newTask, ...this.tasks];
    await this.saveTasks(updated);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;

    const updated = this.tasks.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    await this.saveTasks(updated);
    return { ...task, ...updates };
  }

  async deleteTask(id: string): Promise<boolean> {
    const updated = this.tasks.filter((t) => t.id !== id);
    if (updated.length === this.tasks.length) return false;
    await this.saveTasks(updated);
    return true;
  }

  async toggleComplete(id: string): Promise<Task | null> {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    return this.updateTask(id, { completed: !task.completed });
  }

  getTasks(): Task[] {
    return this.tasks;
  }

  getFilteredTasks(filter: "all" | "active" | "completed"): Task[] {
    return this.tasks.filter((task) => {
      if (filter === "active") return !task.completed;
      if (filter === "completed") return task.completed;
      return true;
    });
  }

  getSortedTasks(filter: "all" | "active" | "completed"): Task[] {
    const filtered = this.getFilteredTasks(filter);
    return [...filtered].sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }

  getStats() {
    return {
      total: this.tasks.length,
      completed: this.tasks.filter((t) => t.completed).length,
      active: this.tasks.filter((t) => !t.completed).length,
    };
  }

  isOverdue(dueDate: string, completed: boolean): boolean {
    if (completed || !dueDate) return false;
    return new Date(dueDate) < new Date();
  }
}

describe("Todo Screen - Task Management", () => {
  let todoManager: TodoManager;

  beforeEach(() => {
    todoManager = new TodoManager();
    vi.clearAllMocks();
  });

  describe("Task Creation", () => {
    it("should create a new task with all required fields", async () => {
      const task = await todoManager.addTask({
        title: "Study Math",
        description: "Chapter 5 - Algebra",
        priority: "high",
        dueDate: "2026-06-15",
        completed: false,
        subject: "Mathematics",
      });

      expect(task.title).toBe("Study Math");
      expect(task.description).toBe("Chapter 5 - Algebra");
      expect(task.priority).toBe("high");
      expect(task.dueDate).toBe("2026-06-15");
      expect(task.completed).toBe(false);
      expect(task.subject).toBe("Mathematics");
      expect(task.id).toBeDefined();
      expect(task.createdAt).toBeDefined();
    });

    it("should add new task to the beginning of the list", async () => {
      const task1 = await todoManager.addTask({
        title: "Task 1",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      const task2 = await todoManager.addTask({
        title: "Task 2",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      const tasks = todoManager.getTasks();
      expect(tasks[0].id).toBe(task2.id);
      expect(tasks[1].id).toBe(task1.id);
    });

    it("should persist tasks to AsyncStorage", async () => {
      await todoManager.addTask({
        title: "Test Task",
        description: "",
        priority: "medium",
        dueDate: "",
        completed: false,
      });

      expect(AsyncStorage.setItem).toHaveBeenCalled();
    });
  });

  describe("Task Update", () => {
    it("should update task properties", async () => {
      const task = await todoManager.addTask({
        title: "Original Title",
        description: "Original Description",
        priority: "low",
        dueDate: "2026-06-20",
        completed: false,
      });

      const updated = await todoManager.updateTask(task.id, {
        title: "Updated Title",
        priority: "high",
      });

      expect(updated?.title).toBe("Updated Title");
      expect(updated?.priority).toBe("high");
      expect(updated?.description).toBe("Original Description");
    });

    it("should return null when updating non-existent task", async () => {
      const result = await todoManager.updateTask("non-existent", {
        title: "New Title",
      });
      expect(result).toBeNull();
    });
  });

  describe("Task Deletion", () => {
    it("should delete a task", async () => {
      const task = await todoManager.addTask({
        title: "Task to Delete",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      const deleted = await todoManager.deleteTask(task.id);
      expect(deleted).toBe(true);
      expect(todoManager.getTasks().length).toBe(0);
    });

    it("should return false when deleting non-existent task", async () => {
      const deleted = await todoManager.deleteTask("non-existent");
      expect(deleted).toBe(false);
    });
  });

  describe("Task Completion", () => {
    it("should toggle task completion status", async () => {
      const task = await todoManager.addTask({
        title: "Task",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      const toggled = await todoManager.toggleComplete(task.id);
      expect(toggled?.completed).toBe(true);

      const toggled2 = await todoManager.toggleComplete(task.id);
      expect(toggled2?.completed).toBe(false);
    });

    it("should return null when toggling non-existent task", async () => {
      const result = await todoManager.toggleComplete("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("Task Filtering", () => {
    beforeEach(async () => {
      await todoManager.addTask({
        title: "Active Task 1",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      await todoManager.addTask({
        title: "Active Task 2",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      await todoManager.addTask({
        title: "Completed Task",
        description: "",
        priority: "low",
        dueDate: "",
        completed: true,
      });
    });

    it("should filter all tasks", () => {
      const filtered = todoManager.getFilteredTasks("all");
      expect(filtered.length).toBe(3);
    });

    it("should filter active tasks only", () => {
      const filtered = todoManager.getFilteredTasks("active");
      expect(filtered.length).toBe(2);
      expect(filtered.every((t) => !t.completed)).toBe(true);
    });

    it("should filter completed tasks only", () => {
      const filtered = todoManager.getFilteredTasks("completed");
      expect(filtered.length).toBe(1);
      expect(filtered.every((t) => t.completed)).toBe(true);
    });
  });

  describe("Task Sorting", () => {
    beforeEach(async () => {
      await todoManager.addTask({
        title: "Task Due Tomorrow",
        description: "",
        priority: "low",
        dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        completed: false,
      });

      await todoManager.addTask({
        title: "Task Due Today",
        description: "",
        priority: "low",
        dueDate: new Date().toISOString().split("T")[0],
        completed: false,
      });

      await todoManager.addTask({
        title: "Completed Task",
        description: "",
        priority: "low",
        dueDate: "",
        completed: true,
      });
    });

    it("should sort incomplete tasks by due date", () => {
      const sorted = todoManager.getSortedTasks("active");
      expect(sorted.length).toBe(2);
      expect(sorted[0].title).toContain("Due Today");
      expect(sorted[1].title).toContain("Due Tomorrow");
    });

    it("should place completed tasks at the end", () => {
      const sorted = todoManager.getSortedTasks("all");
      expect(sorted[sorted.length - 1].completed).toBe(true);
    });
  });

  describe("Task Statistics", () => {
    beforeEach(async () => {
      await todoManager.addTask({
        title: "Task 1",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      await todoManager.addTask({
        title: "Task 2",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      await todoManager.addTask({
        title: "Task 3",
        description: "",
        priority: "low",
        dueDate: "",
        completed: true,
      });
    });

    it("should calculate correct task statistics", () => {
      const stats = todoManager.getStats();
      expect(stats.total).toBe(3);
      expect(stats.active).toBe(2);
      expect(stats.completed).toBe(1);
    });
  });

  describe("Overdue Detection", () => {
    it("should detect overdue tasks", () => {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      const isOverdue = todoManager.isOverdue(yesterday, false);
      expect(isOverdue).toBe(true);
    });

    it("should not mark completed tasks as overdue", () => {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      const isOverdue = todoManager.isOverdue(yesterday, true);
      expect(isOverdue).toBe(false);
    });

    it("should not mark future tasks as overdue", () => {
      const tomorrow = new Date(Date.now() + 86400000)
        .toISOString()
        .split("T")[0];
      const isOverdue = todoManager.isOverdue(tomorrow, false);
      expect(isOverdue).toBe(false);
    });

    it("should not mark tasks without due date as overdue", () => {
      const isOverdue = todoManager.isOverdue("", false);
      expect(isOverdue).toBe(false);
    });
  });

  describe("Priority Levels", () => {
    it("should support all priority levels", async () => {
      const lowTask = await todoManager.addTask({
        title: "Low Priority",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      const mediumTask = await todoManager.addTask({
        title: "Medium Priority",
        description: "",
        priority: "medium",
        dueDate: "",
        completed: false,
      });

      const highTask = await todoManager.addTask({
        title: "High Priority",
        description: "",
        priority: "high",
        dueDate: "",
        completed: false,
      });

      expect(lowTask.priority).toBe("low");
      expect(mediumTask.priority).toBe("medium");
      expect(highTask.priority).toBe("high");
    });
  });

  describe("Subject Assignment", () => {
    it("should assign subject to task", async () => {
      const task = await todoManager.addTask({
        title: "Math Homework",
        description: "",
        priority: "high",
        dueDate: "2026-06-15",
        completed: false,
        subject: "Mathematics",
      });

      expect(task.subject).toBe("Mathematics");
    });

    it("should allow tasks without subject", async () => {
      const task = await todoManager.addTask({
        title: "General Task",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      expect(task.subject).toBeUndefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty task list", () => {
      const stats = todoManager.getStats();
      expect(stats.total).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.completed).toBe(0);
    });

    it("should handle task with very long title", async () => {
      const longTitle = "A".repeat(500);
      const task = await todoManager.addTask({
        title: longTitle,
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      expect(task.title).toBe(longTitle);
    });

    it("should handle task with empty description", async () => {
      const task = await todoManager.addTask({
        title: "Task",
        description: "",
        priority: "low",
        dueDate: "",
        completed: false,
      });

      expect(task.description).toBe("");
    });
  });
});
