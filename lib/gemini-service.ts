/**
 * Gemini AI Service
 *
 * Handles communication with Google Gemini API for:
 * - AI study plan generation
 * - Quiz question generation from topics
 * - Study recommendations
 *
 * Uses EXPO_PUBLIC_GEMINI_API_KEY from environment.
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  error?: { message: string; code: number };
}

class GeminiService {
  private apiKey: string | null = null;

  /**
   * Set the API key. Can be called dynamically when the user provides it.
   */
  setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * Get the configured API key, checking env first.
   */
  private getApiKey(): string | null {
    if (this.apiKey) return this.apiKey;

    // Check environment variable
    const envKey =
      typeof process !== "undefined"
        ? (process.env as any)?.EXPO_PUBLIC_GEMINI_API_KEY
        : undefined;
    if (envKey) {
      this.apiKey = envKey;
      return envKey;
    }

    return null;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!this.getApiKey();
  }

  /**
   * Send a prompt to Gemini and get the text response
   */
  async generateContent(prompt: string, maxRetries = 3): Promise<string> {
    const key = this.getApiKey();
    if (!key) {
      throw new Error("Gemini API key not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY.");
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
              responseMimeType: "application/json",
            },
          }),
        });

        if (response.status === 429) {
          // Rate limited — exponential backoff
          const waitMs = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
          continue;
        }

        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data: GeminiResponse = await response.json();

        if (data.error) {
          throw new Error(`Gemini error: ${data.error.message}`);
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error("Empty response from Gemini");
        }

        return text;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries - 1) {
          const waitMs = Math.pow(2, attempt) * 500;
          await new Promise((resolve) => setTimeout(resolve, waitMs));
        }
      }
    }

    throw lastError || new Error("Failed to generate content after retries");
  }

  /**
   * Generate a study plan for a given subject
   */
  async generateStudyPlan(params: {
    subject: string;
    examName?: string;
    examDate?: string;
    hoursPerDay?: number;
    topics?: string[];
    weakAreas?: string[];
    strongAreas?: string[];
    difficulty?: string;
  }): Promise<{
    title: string;
    description: string;
    topics: string[];
    durationMinutes: number;
    weeklySchedule?: Array<{ day: string; topics: string[]; duration: number }>;
  }> {
    const prompt = `You are an expert study planner. Generate a structured study plan as JSON.

Subject: ${params.subject}
${params.examName ? `Exam: ${params.examName}` : ""}
${params.examDate ? `Exam Date: ${params.examDate}` : ""}
${params.hoursPerDay ? `Available hours per day: ${params.hoursPerDay}` : "Available hours per day: 2"}
${params.topics?.length ? `Topics to cover: ${params.topics.join(", ")}` : ""}
${params.weakAreas?.length ? `Weak areas (need more focus): ${params.weakAreas.join(", ")}` : ""}
${params.strongAreas?.length ? `Strong areas (less focus needed): ${params.strongAreas.join(", ")}` : ""}
Difficulty: ${params.difficulty || "intermediate"}

Return a JSON object with this EXACT structure:
{
  "title": "Descriptive plan title",
  "description": "Brief plan overview (2-3 sentences)",
  "topics": ["Topic 1", "Topic 2", ...],
  "durationMinutes": 120,
  "weeklySchedule": [
    { "day": "Monday", "topics": ["Topic A", "Topic B"], "duration": 60 },
    { "day": "Tuesday", "topics": ["Topic C"], "duration": 45 }
  ]
}

Make the plan practical, specific, and actionable. Prioritize weak areas.`;

    const text = await this.generateContent(prompt);
    return JSON.parse(text);
  }

  /**
   * Generate quiz questions for a subject/topic
   */
  async generateQuizQuestions(params: {
    subject: string;
    topics?: string[];
    count?: number;
    difficulty?: string;
  }): Promise<
    Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      difficulty: string;
      topic: string;
    }>
  > {
    const count = params.count || 10;
    const prompt = `Generate ${count} multiple-choice quiz questions as JSON.

Subject: ${params.subject}
${params.topics?.length ? `Topics: ${params.topics.join(", ")}` : ""}
Difficulty: ${params.difficulty || "mixed"}

Return a JSON array with this EXACT structure for each question:
[
  {
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "The answer is A because...",
    "difficulty": "easy",
    "topic": "Topic Name"
  }
]

Rules:
- Each question must have EXACTLY 4 options
- correctAnswer is the 0-based index of the correct option
- Mix difficulty levels (easy, medium, hard) if "mixed" is specified
- Include clear, educational explanations
- Make questions relevant to competitive exams`;

    const text = await this.generateContent(prompt);
    return JSON.parse(text);
  }

  /**
   * Generate study recommendations based on performance
   */
  async generateRecommendations(params: {
    subject: string;
    studyHistory?: string;
    weakTopics?: string[];
    quizScores?: Array<{ topic: string; score: number }>;
  }): Promise<
    Array<{
      title: string;
      reason: string;
      priority: "low" | "medium" | "high";
      suggestedDuration: number;
    }>
  > {
    const prompt = `Based on the student's performance, generate study recommendations as JSON.

Subject: ${params.subject}
${params.studyHistory ? `Study history: ${params.studyHistory}` : ""}
${params.weakTopics?.length ? `Weak topics: ${params.weakTopics.join(", ")}` : ""}
${params.quizScores?.length ? `Quiz scores: ${JSON.stringify(params.quizScores)}` : ""}

Return a JSON array:
[
  {
    "title": "Recommendation title",
    "reason": "Why this is recommended",
    "priority": "high",
    "suggestedDuration": 30
  }
]

Focus on actionable, specific advice. Prioritize weak areas.`;

    const text = await this.generateContent(prompt);
    return JSON.parse(text);
  }
}

// Export singleton
export const geminiService = new GeminiService();
