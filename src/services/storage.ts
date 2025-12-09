import { ReadingProgress, Series, Book } from '../types';

const PROGRESS_KEY_PREFIX = 'zenreader_progress_';

export const saveProgress = (bookId: string, segmentIndex: number, isCompleted: boolean = false) => {
  const existing = getProgress(bookId);
  const data: ReadingProgress = {
    bookId,
    segmentIndex,
    lastRead: Date.now(),
    isCompleted: isCompleted || (existing?.isCompleted ?? false),
  };
  localStorage.setItem(`${PROGRESS_KEY_PREFIX}${bookId}`, JSON.stringify(data));
};

export const toggleCompletion = (bookId: string, isCompleted: boolean) => {
  const existing = getProgress(bookId);
  const data: ReadingProgress = {
    bookId,
    segmentIndex: existing?.segmentIndex || 0,
    lastRead: Date.now(),
    isCompleted,
  };
  localStorage.setItem(`${PROGRESS_KEY_PREFIX}${bookId}`, JSON.stringify(data));
};

export const getProgress = (bookId: string): ReadingProgress | null => {
  const json = localStorage.getItem(`${PROGRESS_KEY_PREFIX}${bookId}`);
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.error("Failed to parse progress", e);
    return null;
  }
};

/**
 * Returns the most recent timestamp from a book or any book within a series
 */
export const getItemLastRead = (item: Book | Series): number => {
  if (item.type === 'book') {
    return getProgress(item.id)?.lastRead || 0;
  } else {
    // For series, find the most recently read book inside
    let max = 0;
    item.books.forEach(b => {
      const ts = getProgress(b.id)?.lastRead || 0;
      if (ts > max) max = ts;
    });
    return max;
  }
};

/**
 * Returns completion percentage (0-100)
 */
export const getItemProgress = (item: Book | Series): number => {
  if (item.type === 'book') {
    const p = getProgress(item.id);
    if (!p) return 0;
    if (p.isCompleted) return 100;
    return Math.round(((p.segmentIndex + 1) / item.totalSegments) * 100);
  } else {
    // Series progress: Average of books or % of books completed
    // Let's go with % of books completed/started
    if (item.books.length === 0) return 0;
    let totalPercent = 0;
    item.books.forEach(b => {
      const p = getProgress(b.id);
      if (p?.isCompleted) totalPercent += 100;
      else if (p) totalPercent += Math.round(((p.segmentIndex + 1) / b.totalSegments) * 100);
    });
    return Math.round(totalPercent / item.books.length);
  }
};

export const isItemCompleted = (item: Book | Series): boolean => {
  if (item.type === 'book') {
    return getProgress(item.id)?.isCompleted ?? false;
  } else {
    return item.books.every(b => getProgress(b.id)?.isCompleted);
  }
};
