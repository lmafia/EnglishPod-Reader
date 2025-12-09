import { LibraryItem, BookData } from '../types';

// MOCK DATA
// Used as fallback if the real JSON files are not found (e.g. build script hasn't run)
const MOCK_MANIFEST: LibraryItem[] = [
  {
    type: 'series',
    id: "series-english-pod",
    title: "EnglishPod Collection",
    description: "A comprehensive series for English learners.",
    books: [
      {
        type: 'book',
        id: "ep-001",
        title: "Lesson 1: Introduction",
        description: "Welcome to EnglishPod.",
        totalSegments: 5,
        seriesId: "series-english-pod"
      },
      {
        type: 'book',
        id: "ep-002",
        title: "Lesson 2: Difficult Customer",
        description: "Handling complaints nicely.",
        totalSegments: 4,
        seriesId: "series-english-pod"
      }
    ]
  },
  {
    type: 'book',
    id: "demo-steve-jobs",
    title: "Steve Jobs Commencement Speech",
    description: "Stay Hungry. Stay Foolish. Stanford 2005.",
    totalSegments: 3
  }
];

const MOCK_BOOK_CONTENT: Record<string, BookData> = {
  "ep-001": {
    type: 'book',
    id: "ep-001",
    title: "Lesson 1: Introduction",
    totalSegments: 5,
    seriesId: "series-english-pod",
    segments: [
      { id: 1, en: "Hello, English learners, and welcome to EnglishPod.", cn: "你好，英语学习者，欢迎来到EnglishPod。" },
      { id: 2, en: "My name is Marco.", cn: "我叫Marco。" },
      { id: 3, en: "I'm Amira.", cn: "我是Amira。" },
      { id: 4, en: "And Amira and I are here today with a great, great lesson for you.", cn: "今天Amira和我为你们准备了一堂非常棒的课。" },
      { id: 5, en: "Yes, we are.", cn: "是的，我们准备好了。" }
    ]
  },
  "ep-002": {
    type: 'book',
    id: "ep-002",
    title: "Lesson 2: Difficult Customer",
    totalSegments: 4,
    seriesId: "series-english-pod",
    segments: [
      { id: 1, en: "This soup is cold!", cn: "这汤是凉的！" },
      { id: 2, en: "I'm terribly sorry sir, let me change it for you.", cn: "非常抱歉先生，让我为您换一碗。" },
      { id: 3, en: "Don't just change it, I want to speak to the manager.", cn: "别只是换，我要见经理。" },
      { id: 4, en: "Certainly sir.", cn: "好的先生。" }
    ]
  },
  "demo-steve-jobs": {
    type: 'book',
    id: "demo-steve-jobs",
    title: "Steve Jobs Commencement Speech",
    totalSegments: 3,
    segments: [
      { id: 1, en: "I am honored to be with you today at your commencement from one of the finest universities in the world.", cn: "今天，我很荣幸能和你们一起参加毕业典礼，这所大学是世界上最好的大学之一。" },
      { id: 2, en: "I never graduated from college. Truth be told, this is the closest I've ever gotten to a college graduation.", cn: "我从来没有从大学毕业。说实话，这是我离大学毕业最近的一次。" },
      { id: 3, en: "Today I want to tell you three stories from my life. That's it. No big deal. Just three stories.", cn: "今天我想给你们讲三个我生活中的故事。就是这样。没什么大不了的。只是三个故事。" }
    ]
  }
};

export const fetchManifest = async (): Promise<LibraryItem[]> => {
  try {
    const response = await fetch('/assets/subtitles/manifest.json');
    if (!response.ok) throw new Error('Failed to load real manifest');
    return await response.json();
  } catch (error) {
    console.warn("Could not fetch real manifest, falling back to mock data.", error);
    // Add artificial delay to simulate network when falling back
    return new Promise(resolve => setTimeout(() => resolve(MOCK_MANIFEST), 300));
  }
};

export const fetchBook = async (bookId: string): Promise<BookData | null> => {
  try {
    const response = await fetch(`/assets/subtitles/${bookId}.json`);
    if (!response.ok) throw new Error('Failed to load book');
    return await response.json();
  } catch (error) {
    console.warn(`Could not fetch book ${bookId}, falling back to mock data.`, error);
    return new Promise(resolve => setTimeout(() => resolve(MOCK_BOOK_CONTENT[bookId] || null), 300));
  }
};