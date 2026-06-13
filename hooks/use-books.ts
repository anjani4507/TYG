/**
 * useBooks Hook
 * 
 * Provides access to book management and reactive updates
 */

import { useEffect, useState, useCallback } from "react";
import { bookService, Book, BookStats } from "@/lib/book-service";

export function useBooks() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<BookStats | null>(null);

  // Initialize books on mount
  useEffect(() => {
    const initializeBooks = async () => {
      setIsLoading(true);
      await bookService.initialize();
      setBooks(bookService.getBooks());
      setStats(bookService.getStats());
      setIsLoading(false);
    };

    initializeBooks();
  }, []);

  const addBook = useCallback(
    async (
      title: string,
      author: string,
      description: string,
      totalPages: number,
      isPurchased?: boolean,
      cover?: string,
      category?: string,
      tags?: string[]
    ) => {
      const book = await bookService.addBook(
        title,
        author,
        description,
        totalPages,
        isPurchased,
        cover,
        category,
        tags
      );
      setBooks(bookService.getBooks());
      setStats(bookService.getStats());
      return book;
    },
    []
  );

  const addPDFBook = useCallback(
    async (
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
    ) => {
      const book = await bookService.addPDFBook(
        title,
        author,
        description,
        fileUri,
        fileName,
        fileSize,
        totalPages,
        cover,
        category,
        tags
      );
      setBooks(bookService.getBooks());
      setStats(bookService.getStats());
      return book;
    },
    []
  );

  const updateReadingProgress = useCallback(async (bookId: string, currentPage: number) => {
    const book = await bookService.updateReadingProgress(bookId, currentPage);
    setBooks(bookService.getBooks());
    setStats(bookService.getStats());
    return book;
  }, []);

  const purchaseBook = useCallback(async (bookId: string) => {
    const book = await bookService.purchaseBook(bookId);
    setBooks(bookService.getBooks());
    setStats(bookService.getStats());
    return book;
  }, []);

  const deleteBook = useCallback(async (bookId: string) => {
    const success = await bookService.deleteBook(bookId);
    if (success) {
      setBooks(bookService.getBooks());
      setStats(bookService.getStats());
    }
    return success;
  }, []);

  const updateBook = useCallback(async (bookId: string, updates: Partial<Book>) => {
    const book = await bookService.updateBook(bookId, updates);
    if (book) {
      setBooks(bookService.getBooks());
      setStats(bookService.getStats());
    }
    return book;
  }, []);

  const getPurchasedBooks = useCallback(() => {
    return bookService.getPurchasedBooks();
  }, []);

  const getUnpurchasedBooks = useCallback(() => {
    return bookService.getUnpurchasedBooks();
  }, []);

  const getBooksInProgress = useCallback(() => {
    return bookService.getBooksInProgress();
  }, []);

  const getCompletedBooks = useCallback(() => {
    return bookService.getCompletedBooks();
  }, []);

  const searchBooks = useCallback((query: string) => {
    return bookService.searchBooks(query);
  }, []);

  const getBooksByCategory = useCallback((category: string) => {
    return bookService.getBooksByCategory(category);
  }, []);

  const getRecentlyReadBooks = useCallback((limit?: number) => {
    return bookService.getRecentlyReadBooks(limit);
  }, []);

  const getMostReadBook = useCallback(() => {
    return bookService.getMostReadBook();
  }, []);

  return {
    books,
    isLoading,
    stats,
    addBook,
    addPDFBook,
    updateReadingProgress,
    purchaseBook,
    deleteBook,
    updateBook,
    getPurchasedBooks,
    getUnpurchasedBooks,
    getBooksInProgress,
    getCompletedBooks,
    searchBooks,
    getBooksByCategory,
    getRecentlyReadBooks,
    getMostReadBook,
  };
}
