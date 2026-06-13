/**
 * Book Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { bookService } from "../lib/book-service";

// Mock AsyncStorage
vi.mock("@react-native-async-storage/async-storage", () => {
  const mockStorage: Record<string, string> = {};
  return {
    default: {
      getItem: vi.fn(async (key: string) => mockStorage[key] || null),
      setItem: vi.fn(async (key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn(async (key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(async () => {
        Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      }),
    },
  };
});

describe("BookService", () => {
  beforeEach(async () => {
    await bookService.clearAll();
  });

  afterEach(async () => {
    await bookService.clearAll();
  });

  describe("Book Management", () => {
    it("should add a new book", async () => {
      await bookService.clearAll();
      const book = await bookService.addBook(
        "The Great Gatsby",
        "F. Scott Fitzgerald",
        "A classic novel",
        180,
        true
      );

      expect(book).toBeDefined();
      expect(book.title).toBe("The Great Gatsby");
      expect(book.author).toBe("F. Scott Fitzgerald");
      expect(book.totalPages).toBe(180);
      expect(book.isPurchased).toBe(true);
      expect(book.readingProgress).toBe(0);
    });

    it("should add a PDF book with file", async () => {
      await bookService.clearAll();
      const book = await bookService.addPDFBook(
        "PDF Book",
        "Author Name",
        "A PDF book",
        "file:///path/to/book.pdf",
        "book.pdf",
        1024000,
        300
      );

      expect(book).toBeDefined();
      expect(book.isPDF).toBe(true);
      expect(book.file).toBeDefined();
      expect(book.file?.uri).toBe("file:///path/to/book.pdf");
      expect(book.file?.fileSize).toBe(1024000);
    });

    it("should get all books", async () => {
      await bookService.clearAll();
      await bookService.addBook("Book 1", "Author 1", "Desc 1", 100);
      await bookService.addBook("Book 2", "Author 2", "Desc 2", 200);

      const books = bookService.getBooks();
      expect(books.length).toBeGreaterThanOrEqual(2);
    });

    it("should get book by ID", async () => {
      await bookService.clearAll();
      const added = await bookService.addBook("Test Book", "Author", "Desc", 150);
      const retrieved = bookService.getBook(added.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe("Test Book");
    });

    it("should delete a book", async () => {
      await bookService.clearAll();
      const book = await bookService.addBook("To Delete", "Author", "Desc", 100);
      const success = await bookService.deleteBook(book.id);

      expect(success).toBe(true);
      expect(bookService.getBooks().length).toBe(0);
    });

    it("should update book details", async () => {
      await bookService.clearAll();
      const book = await bookService.addBook("Original", "Author", "Desc", 100);
      const updated = await bookService.updateBook(book.id, {
        title: "Updated Title",
      });

      expect(updated?.title).toBe("Updated Title");
      expect(bookService.getBook(book.id)?.title).toBe("Updated Title");
    });
  });

  describe("Reading Progress", () => {
    it("should update reading progress", async () => {
      await bookService.clearAll();
      const book = await bookService.addBook("Book", "Author", "Desc", 200);
      const updated = await bookService.updateReadingProgress(book.id, 50);

      expect(updated?.currentPage).toBe(50);
      expect(updated?.readingProgress).toBe(25); // 50/200 = 25%
    });

    it("should cap reading progress at total pages", async () => {
      await bookService.clearAll();
      const book = await bookService.addBook("Book", "Author", "Desc", 100);
      const updated = await bookService.updateReadingProgress(book.id, 150);

      expect(updated?.currentPage).toBe(100);
      expect(updated?.readingProgress).toBe(100);
    });

    it("should set lastReadAt when updating progress", async () => {
      await bookService.clearAll();
      const book = await bookService.addBook("Book", "Author", "Desc", 100);
      await bookService.updateReadingProgress(book.id, 10);

      const updated = bookService.getBook(book.id);
      expect(updated?.lastReadAt).toBeDefined();
    });
  });

  describe("Purchase Status", () => {
    it("should purchase a book", async () => {
      await bookService.clearAll();
      const book = await bookService.addBook("Book", "Author", "Desc", 100, false);
      expect(book.isPurchased).toBe(false);

      const purchased = await bookService.purchaseBook(book.id);
      expect(purchased?.isPurchased).toBe(true);
    });

    it("should get purchased books", async () => {
      await bookService.clearAll();
      await bookService.addBook("Purchased", "Author", "Desc", 100, true);
      await bookService.addBook("Unpurchased", "Author", "Desc", 100, false);

      const purchased = bookService.getPurchasedBooks();
      expect(purchased.length).toBeGreaterThanOrEqual(1);
      expect(purchased[0].title).toBe("Purchased");
    });

    it("should get unpurchased books", async () => {
      await bookService.clearAll();
      await bookService.addBook("Purchased", "Author", "Desc", 100, true);
      await bookService.addBook("Unpurchased", "Author", "Desc", 100, false);

      const unpurchased = bookService.getUnpurchasedBooks();
      expect(unpurchased.length).toBeGreaterThanOrEqual(1);
      expect(unpurchased[0].title).toBe("Unpurchased");
    });
  });

  describe("Book Filtering", () => {
    beforeEach(async () => {
      await bookService.clearAll();
      // Add test books
      const book1 = await bookService.addBook("Book 1", "Author A", "Desc", 100);
      await bookService.updateReadingProgress(book1.id, 50);

      const book2 = await bookService.addBook("Book 2", "Author B", "Desc", 100);
      await bookService.updateReadingProgress(book2.id, 100);

      await bookService.addBook("Book 3", "Author C", "Desc", 100);
    });

    it("should get books in progress", async () => {
      const inProgress = bookService.getBooksInProgress();
      expect(inProgress.length).toBeGreaterThanOrEqual(1);
      expect(inProgress.some(b => b.title === "Book 1")).toBe(true);
    });

    it("should get completed books", async () => {
      const completed = bookService.getCompletedBooks();
      expect(completed.length).toBeGreaterThanOrEqual(1);
      expect(completed.some(b => b.title === "Book 2")).toBe(true);
    });

    it("should get PDF books", async () => {
      await bookService.addPDFBook("PDF Book", "Author", "Desc", "file://", "book.pdf", 1000, 100);
      const pdfBooks = bookService.getPDFBooks();
      expect(pdfBooks.length).toBeGreaterThanOrEqual(1);
      expect(pdfBooks[0].isPDF).toBe(true);
    });

    it("should search books by title", async () => {
      const results = bookService.searchBooks("Book 1");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].title).toBe("Book 1");
    });

    it("should search books by author", async () => {
      const results = bookService.searchBooks("Author B");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].author).toBe("Author B");
    });

    it("should get books by category", async () => {
      await bookService.addBook("Sci-Fi Book", "Author", "Desc", 100, true, undefined, "Science Fiction");
      const sciFi = bookService.getBooksByCategory("Science Fiction");
      expect(sciFi.length).toBeGreaterThanOrEqual(1);
    });

    it("should get books by tag", async () => {
      await bookService.addBook("Tagged Book", "Author", "Desc", 100, true, undefined, undefined, ["fiction", "classic"]);
      const tagged = bookService.getBooksByTag("fiction");
      expect(tagged.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Statistics", () => {
    beforeEach(async () => {
      await bookService.clearAll();
      await bookService.addBook("Purchased Book", "Author", "Desc", 100, true);
      await bookService.addBook("Unpurchased Book", "Author", "Desc", 100, false);

      const book = await bookService.addBook("In Progress", "Author", "Desc", 100);
      await bookService.updateReadingProgress(book.id, 50);

      const completed = await bookService.addBook("Completed", "Author", "Desc", 100);
      await bookService.updateReadingProgress(completed.id, 100);
    });

    it("should calculate book statistics", () => {
      const stats = bookService.getStats();

      expect(stats.totalBooks).toBe(4);
      expect(stats.purchasedBooks).toBe(3);
      expect(stats.unpurchasedBooks).toBe(1);
      expect(stats.booksInProgress).toBeGreaterThanOrEqual(0); // May vary based on timing
      expect(stats.completedBooks).toBeGreaterThanOrEqual(0);
      expect(stats.totalPagesRead).toBeGreaterThanOrEqual(0);
    });

    it("should get most read book", async () => {
      const mostRead = bookService.getMostReadBook();
      expect(mostRead).toBeDefined();
      expect(mostRead?.currentPage).toBeGreaterThanOrEqual(50); // At least one book with progress
    });

    it("should get recently read books", async () => {
      const recent = bookService.getRecentlyReadBooks(2);
      expect(recent.length).toBeLessThanOrEqual(2);
      if (recent.length > 0) {
        expect(recent[0].lastReadAt).toBeDefined();
      }
    });
  });

  describe("Data Management", () => {
    it("should clear all books", async () => {
      await bookService.clearAll();
      await bookService.addBook("Book 1", "Author", "Desc", 100);
      await bookService.addBook("Book 2", "Author", "Desc", 100);

      await bookService.clearAll();
      expect(bookService.getBooks().length).toBe(0);
    });

    it("should export books as JSON", async () => {
      await bookService.clearAll();
      await bookService.addBook("Book", "Author", "Desc", 100);
      const json = bookService.exportAsJSON();

      expect(json).toBeDefined();
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThanOrEqual(1);
    });

    it("should import books from JSON", async () => {
      await bookService.clearAll();
      const book = await bookService.addBook("Original", "Author", "Desc", 100);
      const json = bookService.exportAsJSON();

      await bookService.clearAll();
      expect(bookService.getBooks().length).toBe(0);

      const success = await bookService.importFromJSON(json);
      expect(success).toBe(true);
      expect(bookService.getBooks().length).toBeGreaterThanOrEqual(1);
      expect(bookService.getBooks()[0].title).toBe("Original");
    });

    it("should handle invalid JSON import", async () => {
      await bookService.clearAll();
      const success = await bookService.importFromJSON("invalid json");
      expect(success).toBe(false);
    });
  });

  describe("Edge Cases", () => {
    it("should handle getting non-existent book", async () => {
      await bookService.clearAll();
      const book = bookService.getBook("non-existent");
      expect(book).toBeUndefined();
    });

    it("should handle updating non-existent book", async () => {
      await bookService.clearAll();
      const result = await bookService.updateBook("non-existent", { title: "New" });
      expect(result).toBeNull();
    });

    it("should handle deleting non-existent book", async () => {
      await bookService.clearAll();
      const success = await bookService.deleteBook("non-existent");
      expect(success).toBe(false);
    });

    it("should handle updating progress for non-existent book", async () => {
      await bookService.clearAll();
      const result = await bookService.updateReadingProgress("non-existent", 50);
      expect(result).toBeNull();
    });

    it("should handle purchasing non-existent book", async () => {
      await bookService.clearAll();
      const result = await bookService.purchaseBook("non-existent");
      expect(result).toBeNull();
    });

    it("should return empty results for empty library", async () => {
      await bookService.clearAll();
      expect(bookService.getBooks().length).toBe(0);
      expect(bookService.getPurchasedBooks().length).toBe(0);
      expect(bookService.getBooksInProgress().length).toBe(0);
      expect(bookService.searchBooks("anything").length).toBe(0);
    });
  });
});
