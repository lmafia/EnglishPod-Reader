import React, { useState, useCallback } from 'react';
import Library from './components/Library';
import Reader from './components/Reader';
import { BookData } from './types';
import { fetchBook } from './services/dataService';

const App: React.FC = () => {
  const [currentBook, setCurrentBook] = useState<BookData | null>(null);
  const [loadingBook, setLoadingBook] = useState(false);

  const handleSelectBook = useCallback(async (bookId: string) => {
    setLoadingBook(true);
    const bookData = await fetchBook(bookId);
    setLoadingBook(false);
    if (bookData) {
      setCurrentBook(bookData);
    }
  }, []);

  const handleBackToLibrary = useCallback(() => {
    setCurrentBook(null);
  }, []);

  return (
    <div className="antialiased text-stone-900 selection:bg-orange-200 selection:text-orange-900">
      {loadingBook && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      )}
      
      {!currentBook ? (
        <Library onSelectBook={handleSelectBook} />
      ) : (
        <Reader book={currentBook} onBack={handleBackToLibrary} />
      )}
    </div>
  );
};

export default App;