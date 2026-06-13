/**
 * Books Screen
 * 
 * PDF management, reading progress tracking, and book library
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useBooks } from "@/hooks/use-books";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";

type BookTab = "all" | "purchased" | "progress" | "completed" | "pdf";

export default function BooksScreen() {
  const colors = useColors();
  const {
    books,
    isLoading,
    stats,
    addPDFBook,
    updateReadingProgress,
    purchaseBook,
    deleteBook,
    searchBooks,
    getPurchasedBooks,
    getBooksInProgress,
    getCompletedBooks,
  } = useBooks();

  const [activeTab, setActiveTab] = useState<BookTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    totalPages: "0",
  });

  const filteredBooks = useMemo(() => {
    let result = books;

    if (searchQuery) {
      result = searchBooks(searchQuery);
    } else {
      switch (activeTab) {
        case "purchased":
          result = getPurchasedBooks();
          break;
        case "progress":
          result = getBooksInProgress();
          break;
        case "completed":
          result = getCompletedBooks();
          break;
        case "pdf":
          result = books.filter((b) => b.isPDF);
          break;
        default:
          result = books;
      }
    }

    return result.sort(
      (a, b) =>
        new Date(b.lastReadAt || b.addedAt).getTime() -
        new Date(a.lastReadAt || a.addedAt).getTime()
    );
  }, [books, activeTab, searchQuery]);

  const currentBook = selectedBook ? books.find((b) => b.id === selectedBook) : null;

  const handlePickPDF = useCallback(async () => {
    try {
      setIsUploading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const totalPages = parseInt(formData.totalPages) || 0;

        if (totalPages <= 0) {
          alert("Please enter the total number of pages");
          setIsUploading(false);
          return;
        }

        await addPDFBook(
          formData.title,
          formData.author,
          formData.description,
          asset.uri,
          asset.name,
          asset.size || 0,
          totalPages
        );

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowAddModal(false);
        setFormData({ title: "", author: "", description: "", totalPages: "0" });
      }
    } catch (error) {
      console.error("Error picking PDF:", error);
      alert("Failed to upload PDF");
    } finally {
      setIsUploading(false);
    }
  }, [formData, addPDFBook]);

  const handleAddBook = useCallback(async () => {
    if (!formData.title) {
      alert("Please enter a book title");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handlePickPDF();
  }, [formData, handlePickPDF]);

  const handleDeleteBook = useCallback(
    async (bookId: string) => {
      await deleteBook(bookId);
      setShowDetailModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [deleteBook]
  );

  const handlePurchaseBook = useCallback(
    async (bookId: string) => {
      await purchaseBook(bookId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [purchaseBook]
  );

  const BookCard = ({ book }: { book: typeof books[0] }) => (
    <Pressable
      onPress={() => {
        setSelectedBook(book.id);
        setShowDetailModal(true);
      }}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        {/* Cover Placeholder */}
        <View
          style={{
            width: 80,
            height: 120,
            backgroundColor: colors.border,
            borderRadius: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 32 }}>📖</Text>
        </View>

        {/* Book Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: colors.foreground,
              marginBottom: 4,
            }}
            numberOfLines={2}
          >
            {book.title}
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: colors.muted,
              marginBottom: 8,
            }}
          >
            {book.author || "Unknown Author"}
          </Text>

          {/* Progress Bar */}
          <View
            style={{
              height: 6,
              backgroundColor: colors.border,
              borderRadius: 3,
              overflow: "hidden",
              marginBottom: 6,
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${book.readingProgress}%`,
                backgroundColor: colors.primary,
              }}
            />
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {book.currentPage}/{book.totalPages}
            </Text>
            <Text style={{ fontSize: 12, color: colors.muted }}>
              {book.readingProgress}%
            </Text>
          </View>

          {/* Status Badge */}
          <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
            {!book.isPurchased && (
              <View
                style={{
                  backgroundColor: colors.warning,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "600", color: "#000" }}>
                  Locked
                </Text>
              </View>
            )}
            {book.isPDF && (
              <View
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 4,
                }}
              >
                <Text style={{ fontSize: 10, fontWeight: "600", color: "#fff" }}>
                  PDF
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <ScreenContainer className="bg-background">
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: "700", color: colors.foreground }}>
            Books
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
            {stats?.totalBooks || 0} books • {stats?.booksInProgress || 0} reading
          </Text>
        </View>

        {/* Search Bar */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surface,
              borderRadius: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 16, color: colors.muted }}>🔍</Text>
            <TextInput
              placeholder="Search books..."
              placeholderTextColor={colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                paddingVertical: 10,
                paddingHorizontal: 8,
                color: colors.foreground,
                fontSize: 14,
              }}
            />
          </View>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingHorizontal: 16,
          }}
        >
          {(["all", "purchased", "progress", "completed", "pdf"] as const).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab);
              }}
              style={{
                paddingVertical: 12,
                paddingHorizontal: 8,
                borderBottomWidth: activeTab === tab ? 2 : 0,
                borderBottomColor: activeTab === tab ? colors.primary : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: activeTab === tab ? "600" : "400",
                  color: activeTab === tab ? colors.foreground : colors.muted,
                  textTransform: "capitalize",
                }}
              >
                {tab === "progress" ? "Reading" : tab}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Books List */}
        {isLoading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredBooks.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 32, marginBottom: 12 }}>📚</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
              No books yet
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
              {searchQuery ? "Try a different search" : "Add your first book"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredBooks}
            renderItem={({ item }) => <BookCard book={item} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 16,
            }}
            scrollEnabled={true}
          />
        )}

        {/* Add Book Button */}
        <Pressable
          onPress={() => {
            setShowAddModal(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          style={({ pressed }) => [
            {
              position: "absolute",
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ fontSize: 28, color: "#fff", fontWeight: "300", marginTop: -2 }}>+</Text>
        </Pressable>
      </View>

      {/* Add Book Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "80%",
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 16 }}>
              Add PDF Book
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>
                Title *
              </Text>
              <TextInput
                placeholder="Book title"
                placeholderTextColor={colors.muted}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.foreground,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>
                Author
              </Text>
              <TextInput
                placeholder="Author name"
                placeholderTextColor={colors.muted}
                value={formData.author}
                onChangeText={(text) => setFormData({ ...formData, author: text })}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.foreground,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>
                Description
              </Text>
              <TextInput
                placeholder="Book description"
                placeholderTextColor={colors.muted}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.foreground,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 6 }}>
                Total Pages *
              </Text>
              <TextInput
                placeholder="Number of pages"
                placeholderTextColor={colors.muted}
                value={formData.totalPages}
                onChangeText={(text) => setFormData({ ...formData, totalPages: text })}
                keyboardType="number-pad"
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: colors.foreground,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />

              {/* Buttons */}
              <View style={{ flexDirection: "row", gap: 12 }}>
                <Pressable
                  onPress={() => {
                    setShowAddModal(false);
                    setFormData({ title: "", author: "", description: "", totalPages: "0" });
                  }}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleAddBook}
                  disabled={isUploading}
                  style={({ pressed }) => [
                    {
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: colors.primary,
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: pressed || isUploading ? 0.7 : 1,
                    },
                  ]}
                >
                  {isUploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                      Upload PDF
                    </Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Book Detail Modal */}
      <Modal visible={showDetailModal && !!currentBook} transparent animationType="slide">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "80%",
            }}
          >
            {currentBook && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.foreground, marginBottom: 12 }}>
                  {currentBook.title}
                </Text>

                <Text style={{ fontSize: 14, color: colors.muted, marginBottom: 8 }}>
                  {currentBook.author || "Unknown Author"}
                </Text>

                {currentBook.description ? (
                  <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 16, lineHeight: 20 }}>
                    {currentBook.description}
                  </Text>
                ) : null}

                {/* Unpurchased Book — Show locked state */}
                {!currentBook.isPurchased ? (
                  <View style={{ alignItems: "center", paddingVertical: 24 }}>
                    <Text style={{ fontSize: 48, marginBottom: 12 }}>🔒</Text>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginBottom: 8 }}>
                      This book is locked
                    </Text>
                    <Text style={{ fontSize: 14, color: colors.muted, textAlign: "center", marginBottom: 20 }}>
                      Purchase this book to start reading
                    </Text>
                    <Pressable
                      onPress={() => handlePurchaseBook(currentBook.id)}
                      style={({ pressed }) => [
                        {
                          width: "100%",
                          paddingVertical: 14,
                          borderRadius: 12,
                          backgroundColor: colors.primary,
                          justifyContent: "center",
                          alignItems: "center",
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                        Unlock Book
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    {/* Progress Section */}
                    <View
                      style={{
                        backgroundColor: colors.surface,
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 16,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: "600", color: colors.muted, marginBottom: 8 }}>
                        Reading Progress
                      </Text>
                      <View
                        style={{
                          height: 8,
                          backgroundColor: colors.border,
                          borderRadius: 4,
                          overflow: "hidden",
                          marginBottom: 8,
                        }}
                      >
                        <View
                          style={{
                            height: "100%",
                            width: `${currentBook.readingProgress}%`,
                            backgroundColor: colors.primary,
                          }}
                        />
                      </View>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                        {currentBook.currentPage}/{currentBook.totalPages} pages ({currentBook.readingProgress}%)
                      </Text>

                      {/* Page Update Controls */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
                        <Pressable
                          onPress={() => {
                            const newPage = Math.max(0, currentBook.currentPage - 10);
                            updateReadingProgress(currentBook.id, newPage);
                          }}
                          style={({ pressed }) => [{
                            paddingHorizontal: 12, paddingVertical: 8,
                            borderRadius: 8, backgroundColor: colors.border,
                            opacity: pressed ? 0.7 : 1,
                          }]}
                        >
                          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>-10</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            const newPage = Math.max(0, currentBook.currentPage - 1);
                            updateReadingProgress(currentBook.id, newPage);
                          }}
                          style={({ pressed }) => [{
                            paddingHorizontal: 12, paddingVertical: 8,
                            borderRadius: 8, backgroundColor: colors.border,
                            opacity: pressed ? 0.7 : 1,
                          }]}
                        >
                          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>-1</Text>
                        </Pressable>
                        <View style={{ flex: 1, alignItems: "center" }}>
                          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary }}>
                            Page {currentBook.currentPage}
                          </Text>
                        </View>
                        <Pressable
                          onPress={() => {
                            const newPage = Math.min(currentBook.totalPages, currentBook.currentPage + 1);
                            updateReadingProgress(currentBook.id, newPage);
                          }}
                          style={({ pressed }) => [{
                            paddingHorizontal: 12, paddingVertical: 8,
                            borderRadius: 8, backgroundColor: colors.border,
                            opacity: pressed ? 0.7 : 1,
                          }]}
                        >
                          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>+1</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            const newPage = Math.min(currentBook.totalPages, currentBook.currentPage + 10);
                            updateReadingProgress(currentBook.id, newPage);
                          }}
                          style={({ pressed }) => [{
                            paddingHorizontal: 12, paddingVertical: 8,
                            borderRadius: 8, backgroundColor: colors.border,
                            opacity: pressed ? 0.7 : 1,
                          }]}
                        >
                          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>+10</Text>
                        </Pressable>
                      </View>
                    </View>

                    {/* Continue Reading Button */}
                    {currentBook.isPDF && currentBook.file && (
                      <Pressable
                        onPress={() => {
                          if (currentBook.file?.uri) {
                            Linking.openURL(currentBook.file.uri).catch(() => {
                              Alert.alert("Error", "Could not open PDF file");
                            });
                          }
                        }}
                        style={({ pressed }) => [{
                          paddingVertical: 14,
                          borderRadius: 12,
                          backgroundColor: colors.primary,
                          justifyContent: "center",
                          alignItems: "center",
                          opacity: pressed ? 0.7 : 1,
                          marginBottom: 12,
                        }]}
                      >
                        <Text style={{ fontSize: 16, fontWeight: "600", color: "#fff" }}>
                          {currentBook.currentPage > 0 ? "Continue Reading" : "Start Reading"}
                        </Text>
                      </Pressable>
                    )}

                    {/* Action Buttons */}
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <Pressable
                        onPress={() => handleDeleteBook(currentBook.id)}
                        style={({ pressed }) => [
                          {
                            flex: 1,
                            paddingVertical: 12,
                            borderRadius: 8,
                            backgroundColor: colors.error,
                            justifyContent: "center",
                            alignItems: "center",
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>
                          Delete
                        </Text>
                      </Pressable>
                    </View>
                  </>
                )}

                <Pressable
                  onPress={() => setShowDetailModal(false)}
                  style={({ pressed }) => [
                    {
                      marginTop: 12,
                      paddingVertical: 12,
                      borderRadius: 8,
                      backgroundColor: colors.surface,
                      justifyContent: "center",
                      alignItems: "center",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground }}>
                    Close
                  </Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
