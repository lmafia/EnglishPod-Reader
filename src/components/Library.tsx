import React, { useMemo, useState } from "react";
import { Book, LibraryItem, Series } from "../types";
import {
  BookOpen,
  Layers,
  ChevronLeft,
  CheckCircle,
  Circle,
  Check,
} from "lucide-react";
import {
  getItemLastRead,
  getItemProgress,
  isItemCompleted,
  toggleCompletion,
  markSeriesCompletion,
} from "../services/storage";

interface LibraryProps {
  items: LibraryItem[];
  selectedSeries: Series | null;
  onSelectSeries: (series: Series | null) => void;
  onSelectBook: (bookId: string) => void;
}

const Library: React.FC<LibraryProps> = ({
  items,
  selectedSeries,
  onSelectSeries,
  onSelectBook,
}) => {
  const [hideCompleted, setHideCompleted] = useState(false);
  // We need a local state to force re-render when storage changes,
  // since localStorage doesn't trigger React updates automatically.
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filter and Sort Logic
  const processItems = (list: LibraryItem[]): LibraryItem[] => {
    let result = [...list];

    // 1. Sort by Recently Read
    result.sort((a, b) => getItemLastRead(b) - getItemLastRead(a));

    // 2. Filter Completed
    if (hideCompleted) {
      result = result.filter((item) => !isItemCompleted(item));
    }

    return result;
  };

  const displayedItems = useMemo(() => {
    if (selectedSeries) {
      // If looking at a series, we are displaying books
      const books = processItems(
        selectedSeries.books as unknown as LibraryItem[]
      );
      return books as unknown as Book[];
    }
    return processItems(items);
  }, [items, selectedSeries, hideCompleted, refreshTrigger]);

  const handleToggleCompletion = (
    e: React.MouseEvent,
    item: LibraryItem,
    isCurrentlyDone: boolean
  ) => {
    e.stopPropagation(); // Prevent opening the book/series

    if (item.type === "book") {
      toggleCompletion(item.id, !isCurrentlyDone);
    } else if (item.type === "series") {
      markSeriesCompletion(item as Series, !isCurrentlyDone);
    }

    // Force UI update
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9] px-4 py-8 md:p-12 text-stone-900">
      {/* Header Section */}
      <header className="mb-8 md:mb-12 max-w-4xl mx-auto">
        {/* Navigation / Top Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {selectedSeries ? (
              <button
                onClick={() => onSelectSeries(null)}
                className="group flex items-center gap-1 text-stone-400 hover:text-stone-900 mb-3 transition-colors text-sm font-medium tracking-wide uppercase"
              >
                <ChevronLeft
                  size={16}
                  className="group-hover:-translate-x-1 transition-transform"
                />
                <span>Library</span>
              </button>
            ) : (
              <div className="h-8"></div> // Spacer to align with back button height
            )}

            <h1 className="text-2xl md:text-4xl font-serif font-bold text-stone-900 leading-tight">
              {selectedSeries ? selectedSeries.title : "Library"}
            </h1>

            <p className="text-stone-500 mt-2 text-sm md:text-base leading-relaxed max-w-xl">
              {selectedSeries ? selectedSeries.description : "Your collection."}
            </p>
          </div>

          {/* Filter Toggle - Compact & Right Aligned */}
          <button
            onClick={() => setHideCompleted(!hideCompleted)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-wide border transition-all
              ${
                hideCompleted
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-900"
              }
            `}
          >
            {hideCompleted ? <CheckCircle size={14} /> : <Circle size={14} />}
            <span className="hidden sm:inline">
              {hideCompleted ? "Finished hidden" : "Show all"}
            </span>
          </button>
        </div>
      </header>

      {/* Empty State */}
      {displayedItems.length === 0 && (
        <div className="text-center py-32 border border-dashed border-stone-200 rounded-xl max-w-4xl mx-auto">
          <p className="text-stone-400 font-serif italic">No items found.</p>
          {hideCompleted && (
            <button
              onClick={() => setHideCompleted(false)}
              className="mt-4 text-xs font-bold text-stone-900 uppercase border-b border-stone-900 pb-0.5 hover:opacity-60"
            >
              Show Completed
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 max-w-4xl mx-auto">
        {displayedItems.map((item) => {
          const isSeries = item.type === "series";
          const progress = getItemProgress(item);
          const isDone = isItemCompleted(item);

          return (
            <div
              key={item.id}
              onClick={() => {
                if (isSeries) {
                  onSelectSeries(item as Series);
                } else {
                  onSelectBook(item.id);
                }
              }}
              className="group relative flex flex-col h-full text-left cursor-pointer transition-transform duration-300 ease-out hover:-translate-y-1"
            >
              {/* Card Container */}
              <div className="flex-1 bg-white border border-stone-200 rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)] group-hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] group-hover:border-stone-300 transition-all">
                {/* Icon & Status Row */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`
                    w-10 h-10 flex items-center justify-center rounded-lg border transition-colors
                    ${
                      isSeries
                        ? "bg-stone-50 border-stone-100 text-stone-800"
                        : "bg-white border-stone-100 text-stone-400 group-hover:text-stone-600"
                    }
                  `}
                  >
                    {isSeries ? <Layers size={18} /> : <BookOpen size={18} />}
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={(e) => handleToggleCompletion(e, item, isDone)}
                    className={`
                      w-8 h-8 flex items-center justify-center rounded-full transition-all
                      ${
                        isDone
                          ? "bg-stone-100 text-stone-900 hover:bg-stone-200 hover:text-black"
                          : "bg-transparent text-stone-200 hover:bg-stone-100 hover:text-stone-400"
                      }
                    `}
                    title={isDone ? "Mark as unfinished" : "Mark as finished"}
                  >
                    {isDone ? (
                      <CheckCircle
                        size={14}
                        strokeWidth={2}
                      />
                    ) : (
                      <Circle
                        size={14}
                        strokeWidth={2}
                      />
                    )}
                  </button>
                </div>

                {/* Text Content */}
                <h3 className="font-serif font-bold text-lg text-stone-900 mb-2 leading-tight group-hover:underline decoration-stone-300 underline-offset-4 decoration-1">
                  {item.title}
                </h3>
                <p className="text-stone-500 text-xs leading-relaxed line-clamp-2">
                  {item.type === "series"
                    ? `${(item as Series).books.length} items`
                    : item.description || "No description."}
                </p>

                {/* Footer / Progress */}
                <div className="mt-6">
                  {progress > 0 && !isDone && (
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-stone-800 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {/* Subtle cue for series that haven't started */}
                  {progress === 0 && isSeries && (
                    <span className="text-[10px] text-stone-300 uppercase tracking-widest group-hover:text-stone-400 transition-colors">
                      Collection
                    </span>
                  )}
                  {isDone && (
                    <span className="text-[10px] font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1">
                      Done
                    </span>
                  )}
                </div>
              </div>

              {/* Stack effect for series cards */}
              {isSeries && (
                <div className="absolute inset-x-2 -bottom-1 h-2 bg-white border border-stone-200 rounded-b-xl -z-10 shadow-sm"></div>
              )}
            </div>
          );
        })}
      </div>

    
      {/* Footer / Donation QR */}
      <footer className="mt-auto pt-24 pb-8 flex flex-col items-center justify-center opacity-90 hover:opacity-100 transition-opacity duration-500">
        <a className="text-[16px] font-bold tracking-widest uppercase text-stone-400 mb-2">
            如果这个项目帮你节省了时间, 欢迎请我喝杯咖啡.
          </a>
        <div className="p-3 bg-white border border-stone-200 rounded-2xl shadow-sm">
            <img 
              src="https://image-s3.kylegeeks.com/data/2025/12/fd02bb11d4b8280805e39a5b864086e9.png" 
              alt="Donate" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-lg"
            />

        </div>
                        <a className="text-[12px] font-bold tracking-widest text-stone-400 mb-6">
            WeChat赞赏
          </a>
      </footer>

    </div>
  );
};

export default Library;
