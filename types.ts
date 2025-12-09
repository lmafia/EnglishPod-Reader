export interface Segment {
  id: number;
  startTime?: string;
  en: string;
  cn: string;
}

export interface Book {
  type: 'book';
  id: string;
  title: string;
  description?: string;
  totalSegments: number;
  seriesId?: string; // Reference to parent if exists
}

export interface Series {
  type: 'series';
  id: string;
  title: string;
  description?: string;
  books: Book[];
}

export type LibraryItem = Book | Series;

export interface BookData extends Book {
  segments: Segment[];
}

export enum DisplayMode {
  Bilingual = 'bi',
  English = 'en',
  Chinese = 'cn'
}

export interface ReadingProgress {
  bookId: string;
  segmentIndex: number;
  lastRead: number; // Timestamp
  isCompleted: boolean;
}
