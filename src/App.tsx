import React, { useState, useCallback, useEffect } from "react";
import Library from "./components/Library";
import Reader from "./components/Reader";
import { BookData, LibraryItem, Series } from "./types";
import { fetchBook, fetchManifest } from "./services/dataService";

const App: React.FC = () => {
  // Navigation State
  const [manifest, setManifest] = useState<LibraryItem[]>([]);
  const [currentSeries, setCurrentSeries] = useState<Series | null>(null);
  const [currentBook, setCurrentBook] = useState<BookData | null>(null);

  // Loading State
  const [loadingManifest, setLoadingManifest] = useState(true);
  const [loadingBook, setLoadingBook] = useState(false);

  // Initial Data Load
  useEffect(() => {
    fetchManifest().then((data) => {
      setManifest(data);
      setLoadingManifest(false);
    });
  }, []);

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
    // Note: We intentionally do NOT reset currentSeries here.
    // This ensures we go back to the collection view if we were in one.
  }, []);

  if (loadingManifest) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#fcfbf9]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
          <div className="text-stone-400 text-sm tracking-widest uppercase">
            Loading Library
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="antialiased text-stone-900 selection:bg-orange-200 selection:text-orange-900">
      {loadingBook && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-800"></div>
        </div>
      )}

      {!currentBook ? (
        <Library
          items={manifest}
          selectedSeries={currentSeries}
          onSelectSeries={setCurrentSeries}
          onSelectBook={handleSelectBook}
        />
      ) : (
        <Reader
          book={currentBook}
          onBack={handleBackToLibrary}
        />
      )}
    </div>
  );
};

export default App;
