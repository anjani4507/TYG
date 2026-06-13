/**
 * Exam Type Categories
 * 
 * Predefined categories for group discovery and filtering
 */

export interface ExamCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const EXAM_CATEGORIES: Record<string, ExamCategory> = {
  jee: {
    id: 'jee',
    name: 'JEE',
    description: 'Joint Entrance Examination (Engineering)',
    icon: 'graduation-cap',
    color: '#3B82F6',
    difficulty: 'advanced',
  },
  upsc: {
    id: 'upsc',
    name: 'UPSC',
    description: 'Union Public Service Commission (Civil Services)',
    icon: 'briefcase',
    color: '#8B5CF6',
    difficulty: 'advanced',
  },
  gate: {
    id: 'gate',
    name: 'GATE',
    description: 'Graduate Aptitude Test in Engineering',
    icon: 'book',
    color: '#EC4899',
    difficulty: 'advanced',
  },
  neet: {
    id: 'neet',
    name: 'NEET',
    description: 'National Eligibility cum Entrance Test (Medical)',
    icon: 'heart',
    color: '#EF4444',
    difficulty: 'advanced',
  },
  cat: {
    id: 'cat',
    name: 'CAT',
    description: 'Common Admission Test (MBA)',
    icon: 'trending-up',
    color: '#F59E0B',
    difficulty: 'advanced',
  },
  gre: {
    id: 'gre',
    name: 'GRE',
    description: 'Graduate Record Examination',
    icon: 'globe',
    color: '#10B981',
    difficulty: 'advanced',
  },
  ielts: {
    id: 'ielts',
    name: 'IELTS',
    description: 'International English Language Testing System',
    icon: 'volume-2',
    color: '#06B6D4',
    difficulty: 'intermediate',
  },
  toefl: {
    id: 'toefl',
    name: 'TOEFL',
    description: 'Test of English as a Foreign Language',
    icon: 'volume-2',
    color: '#0EA5E9',
    difficulty: 'intermediate',
  },
  ssc: {
    id: 'ssc',
    name: 'SSC',
    description: 'Staff Selection Commission',
    icon: 'briefcase',
    color: '#6366F1',
    difficulty: 'intermediate',
  },
  banking: {
    id: 'banking',
    name: 'Banking',
    description: 'Banking & Financial Services Exams',
    icon: 'credit-card',
    color: '#14B8A6',
    difficulty: 'intermediate',
  },
  general: {
    id: 'general',
    name: 'General Studies',
    description: 'General Knowledge & Current Affairs',
    icon: 'book-open',
    color: '#64748B',
    difficulty: 'beginner',
  },
  other: {
    id: 'other',
    name: 'Other',
    description: 'Other Competitive Exams',
    icon: 'more-horizontal',
    color: '#94A3B8',
    difficulty: 'beginner',
  },
};

/**
 * Get all categories as array
 */
export function getAllCategories(): ExamCategory[] {
  return Object.values(EXAM_CATEGORIES);
}

/**
 * Get category by ID
 */
export function getCategoryById(id: string): ExamCategory | undefined {
  return EXAM_CATEGORIES[id];
}

/**
 * Get categories by difficulty
 */
export function getCategoriesByDifficulty(difficulty: string): ExamCategory[] {
  return Object.values(EXAM_CATEGORIES).filter((cat) => cat.difficulty === difficulty);
}

/**
 * Search categories
 */
export function searchCategories(query: string): ExamCategory[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(EXAM_CATEGORIES).filter(
    (cat) =>
      cat.name.toLowerCase().includes(lowerQuery) ||
      cat.description.toLowerCase().includes(lowerQuery)
  );
}
