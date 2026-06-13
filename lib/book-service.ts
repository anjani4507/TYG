/**
 * Book Service
 * 
 * Manages book data, PDF files, reading progress, and purchase status
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface BookFile {
  id: string;
  uri: string; // File system URI
  fileName: string;
  fileSize: number; // in bytes
  uploadedAt: string;
}

export interface Book {
  id: string;
  title: string;
  author?: string;
  description?: string;
  cover?: string; // Image URI or URL
  isPurchased: boolean;
  isPDF: boolean;
  file?: BookFile;
  currentPage: number;
  totalPages: number;
  readingProgress: number; // 0-100
  lastReadAt?: string;
  addedAt: string;
  category?: string;
  tags?: string[];
}

export interface BookStats {
  totalBooks: number;
  purchasedBooks: number;
  unpurchasedBooks: number;
  booksInProgress: number;
  completedBooks: number;
  totalPagesRead: number;
}

class BookService {
  private books: Book[] = [];
  private storageKey = "books";
  private statsKey = "book_stats";

  /**
   * Initialize book service
   */
  async initialize(): Promise<void> {
    await this.loadBooks();
  }

  /**
   * Load books from AsyncStorage
   */
  private async loadBooks(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        this.books = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load books:", error);
    }
  }

  /**
   * Save books to AsyncStorage
   */
  private async saveBooks(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.books));
    } catch (error) {
      console.error("Failed to save books:", error);
    }
  }

  /**
   * Add a new book
   */
  async addBook(
    title: string,
    author: string,
    description: string,
    totalPages: number,
    isPurchased: boolean = true,
    cover?: string,
    category?: string,
    tags?: string[]
  ): Promise<Book> {
    const book: Book = {
      id: `book_${Date.now()}`,
      title,
      author,
      description,
      cover,
      isPurchased,
      isPDF: false,
      currentPage: 0,
      totalPages,
      readingProgress: 0,
      addedAt: new Date().toISOString(),
      category,
      tags,
    };

    this.books.push(book);
    await this.saveBooks();
    return book;
  }

  /**
   * Add a PDF book with file
   */
  async addPDFBook(
    title: string,
    author: string,
    description: string,
    fileUri: string,
    fileName: string,
    fileSize: number,
    totalPages: number,
    cover?: string,
    category?: string,
    tags?: string[]
  ): Promise<Book> {
    const book: Book = {
      id: `book_${Date.now()}`,
      title,
      author,
      description,
      cover,
      isPurchased: true,
      isPDF: true,
      file: {
        id: `file_${Date.now()}`,
        uri: fileUri,
        fileName,
        fileSize,
        uploadedAt: new Date().toISOString(),
      },
      currentPage: 0,
      totalPages,
      readingProgress: 0,
      addedAt: new Date().toISOString(),
      category,
      tags,
    };

    this.books.push(book);
    await this.saveBooks();
    return book;
  }

  /**
   * Update book reading progress
   */
  async updateReadingProgress(
    bookId: string,
    currentPage: number
  ): Promise<Book | null> {
    const book = this.books.find((b) => b.id === bookId);
    if (!book) return null;

    book.currentPage = Math.min(currentPage, book.totalPages);
    book.readingProgress = Math.round((book.currentPage / book.totalPages) * 100);
    book.lastReadAt = new Date().toISOString();

    await this.saveBooks();
    return book;
  }

  /**
   * Purchase a book
   */
  async purchaseBook(bookId: string): Promise<Book | null> {
    const book = this.books.find((b) => b.id === bookId);
    if (!book) return null;

    book.isPurchased = true;
    await this.saveBooks();
    return book;
  }

  /**
   * Get all books
   */
  getBooks(): Book[] {
    return [...this.books];
  }

  /**
   * Get book by ID
   */
  getBook(id: string): Book | undefined {
    return this.books.find((b) => b.id === id);
  }

  /**
   * Get purchased books
   */
  getPurchasedBooks(): Book[] {
    return this.books.filter((b) => b.isPurchased);
  }

  /**
   * Get unpurchased books
   */
  getUnpurchasedBooks(): Book[] {
    return this.books.filter((b) => !b.isPurchased);
  }

  /**
   * Get books in progress
   */
  getBooksInProgress(): Book[] {
    return this.books.filter((b) => b.isPurchased && b.readingProgress > 0 && b.readingProgress < 100);
  }

  /**
   * Get completed books
   */
  getCompletedBooks(): Book[] {
    return this.books.filter((b) => b.readingProgress === 100);
  }

  /**
   * Get PDF books
   */
  getPDFBooks(): Book[] {
    return this.books.filter((b) => b.isPDF && b.file);
  }

  /**
   * Search books by title or author
   */
  searchBooks(query: string): Book[] {
    const lowerQuery = query.toLowerCase();
    return this.books.filter(
      (b) =>
        b.title.toLowerCase().includes(lowerQuery) ||
        b.author?.toLowerCase().includes(lowerQuery) ||
        b.description?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get books by category
   */
  getBooksByCategory(category: string): Book[] {
    return this.books.filter((b) => b.category === category);
  }

  /**
   * Get books by tag
   */
  getBooksByTag(tag: string): Book[] {
    return this.books.filter((b) => b.tags?.includes(tag));
  }

  /**
   * Delete a book
   */
  async deleteBook(bookId: string): Promise<boolean> {
    const index = this.books.findIndex((b) => b.id === bookId);
    if (index === -1) return false;

    this.books.splice(index, 1);
    await this.saveBooks();
    return true;
  }

  /**
   * Update book details
   */
  async updateBook(bookId: string, updates: Partial<Book>): Promise<Book | null> {
    const book = this.books.find((b) => b.id === bookId);
    if (!book) return null;

    Object.assign(book, updates);
    await this.saveBooks();
    return book;
  }

  /**
   * Get book statistics
   */
  getStats(): BookStats {
    const purchasedBooks = this.books.filter((b) => b.isPurchased);
    const unpurchasedBooks = this.books.filter((b) => !b.isPurchased);
    const booksInProgress = purchasedBooks.filter(
      (b) => b.readingProgress > 0 && b.readingProgress < 100
    );
    const completedBooks = purchasedBooks.filter((b) => b.readingProgress === 100);
    const totalPagesRead = purchasedBooks.reduce((sum, b) => sum + b.currentPage, 0);

    return {
      totalBooks: this.books.length,
      purchasedBooks: purchasedBooks.length,
      unpurchasedBooks: unpurchasedBooks.length,
      booksInProgress: booksInProgress.length,
      completedBooks: completedBooks.length,
      totalPagesRead,
    };
  }

  /**
   * Get reading streak (consecutive days read)
   */
  getReadingStreak(): number {
    if (this.books.length === 0) return 0;

    const sortedBooks = [...this.books]
      .filter((b) => b.lastReadAt)
      .sort(
        (a, b) =>
          new Date(b.lastReadAt || "").getTime() -
          new Date(a.lastReadAt || "").getTime()
      );

    if (sortedBooks.length === 0) return 0;

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastReadDate = new Date(sortedBooks[0].lastReadAt || "");
    lastReadDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor(
      (today.getTime() - lastReadDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff > 1) return 0; // Streak broken
    if (dayDiff === 1) {
      // Check if there's a read yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      for (const book of sortedBooks) {
        const readDate = new Date(book.lastReadAt || "");
        readDate.setHours(0, 0, 0, 0);
        if (readDate.getTime() === yesterday.getTime()) {
          streak = 2;
          break;
        }
      }
    }

    return streak;
  }

  /**
   * Get most read book
   */
  getMostReadBook(): Book | undefined {
    if (this.books.length === 0) return undefined;
    return [...this.books].sort((a, b) => b.currentPage - a.currentPage)[0];
  }

  /**
   * Get recently read books
   */
  getRecentlyReadBooks(limit: number = 5): Book[] {
    return [...this.books]
      .filter((b) => b.lastReadAt)
      .sort(
        (a, b) =>
          new Date(b.lastReadAt || "").getTime() -
          new Date(a.lastReadAt || "").getTime()
      )
      .slice(0, limit);
  }

  /**
   * Clear all books
   */
  async clearAll(): Promise<void> {
    this.books = [];
    await this.saveBooks();
  }

  /**
   * Export books as JSON
   */
  exportAsJSON(): string {
    return JSON.stringify(this.books, null, 2);
  }

  /**
   * Import books from JSON
   */
  async importFromJSON(json: string): Promise<boolean> {
    try {
      const imported = JSON.parse(json);
      if (!Array.isArray(imported)) return false;
      this.books = imported;
      await this.saveBooks();
      return true;
    } catch (error) {
      console.error("Failed to import books:", error);
      return false;
    }
  }
}

// Export singleton instance
export const bookService = new BookService();
