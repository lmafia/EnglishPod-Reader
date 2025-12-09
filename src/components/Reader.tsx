import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, Check, Circle } from "lucide-react";
import { BookData, DisplayMode } from "../types";
import {
  saveProgress,
  getProgress,
  toggleCompletion,
} from "../services/storage";

interface ReaderProps {
  book: BookData;
  onBack: () => void;
}

const Reader: React.FC<ReaderProps> = ({ book, onBack }) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(
    DisplayMode.Bilingual
  );
  const [fontSize, setFontSize] = useState(18);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize: Load progress
  useEffect(() => {
    const saved = getProgress(book.id);
    if (saved) {
      setIsCompleted(saved.isCompleted || false);
      if (
        saved.segmentIndex >= 0 &&
        saved.segmentIndex < book.segments.length
      ) {
        setActiveSegmentIndex(saved.segmentIndex);
        // Initial scroll after render
        setTimeout(() => {
          segmentRefs.current[saved.segmentIndex]?.scrollIntoView({
            behavior: "auto",
            block: "center",
          });
        }, 50);
      }
    }
  }, [book.id, book.segments.length]);

  // Maintain scroll position when content layout changes (Language toggle or Font size)
  useLayoutEffect(() => {
    // Only snap if we aren't currently dragging the slider
    if (!isDragging) {
      const el = segmentRefs.current[activeSegmentIndex];
      if (el) {
        el.scrollIntoView({ behavior: "auto", block: "center" });
      }
    }
  }, [displayMode, fontSize]);

  // Setup Intersection Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const options = {
      root: containerRef.current,
      // Adjust rootMargin to make the "active" detection area very narrow in the center
      rootMargin: "-49% 0px -49% 0px",
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      // If user is dragging the slider, ignore scroll events to prevent jitter
      if (isDragging) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(
            entry.target.getAttribute("data-index") || "0",
            10
          );
          setActiveSegmentIndex(index);
          saveProgress(book.id, index);
        }
      });
    }, options);

    segmentRefs.current.forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [book.segments, isDragging]);

  // Handle Scroll to toggle controls
  const lastScrollY = useRef(0);
  const handleScroll = () => {
    if (!containerRef.current || isDragging) return;
    const currentScrollY = containerRef.current.scrollTop;
    if (Math.abs(currentScrollY - lastScrollY.current) > 50) {
      if (showControls) setShowControls(false);
      lastScrollY.current = currentScrollY;
    }
  };

  const handleContainerClick = () => {
    if (!isDragging) {
      setShowControls(!showControls);
    }
  };

  const toggleReadStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isCompleted;
    setIsCompleted(newState);
    toggleCompletion(book.id, newState);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value, 10);
    setActiveSegmentIndex(newIndex);

    const el = segmentRefs.current[newIndex];
    if (el) {
      el.scrollIntoView({ behavior: "auto", block: "center" });
    }
  };

  const handleSliderPointerDown = () => setIsDragging(true);
  const handleSliderPointerUp = () => {
    setIsDragging(false);
    // Ensure we save where they dropped it
    saveProgress(book.id, activeSegmentIndex);
  };

  // 1-based index for display
  const currentDisplayIndex = activeSegmentIndex + 1;
  const totalSegments = book.segments.length;

  return (
    <div className="relative h-screen w-full bg-[#fcfbf9] overflow-hidden flex flex-col font-sans">
      {/* --- TOP BAR --- */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out ${
          showControls
            ? "translate-y-0 opacity-100"
            : "-translate-y-full opacity-0"
        }`}
      >
        <div className="bg-[#fcfbf9]/90 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-stone-500 hover:text-stone-900 rounded-full transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <h1 className="text-stone-800 font-medium text-xs tracking-wider uppercase truncate max-w-[50%] opacity-80">
            {book.title}
          </h1>

          <button
            onClick={toggleReadStatus}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
              isCompleted
                ? "bg-stone-900 text-white ring-1 ring-stone-900"
                : "bg-transparent text-stone-500 ring-1 ring-stone-200 hover:text-stone-900 hover:ring-stone-400"
            }`}
          >
            {isCompleted ? (
              <Check
                size={12}
                strokeWidth={3}
              />
            ) : (
              <Circle
                size={12}
                strokeWidth={3}
              />
            )}
            <span>{isCompleted ? "Done" : "Mark Done"}</span>
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div
        className="flex-1 relative w-full h-full"
        onClick={handleContainerClick}
      >
        {/* Scroll Container - Content is always fully opaque now */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto no-scrollbar px-6 py-[50vh]"
        >
          <div className="max-w-xl mx-auto space-y-12">
            {book.segments.map((segment, index) => {
              // We still track active index for the slider, but we don't fade out others visually

              return (
                <div
                  key={segment.id}
                  data-index={index}
                  ref={(el) => {
                    segmentRefs.current[index] = el;
                  }}
                  className="transition-all duration-500 flex flex-col gap-4 opacity-100"
                >
                  {(displayMode === DisplayMode.Bilingual ||
                    displayMode === DisplayMode.English) && (
                    <p
                      className="font-serif text-stone-900 leading-relaxed transition-all"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {segment.en}
                    </p>
                  )}
                  {(displayMode === DisplayMode.Bilingual ||
                    displayMode === DisplayMode.Chinese) && (
                    <p
                      className="text-stone-500 font-medium leading-loose tracking-wide transition-all"
                      style={{ fontSize: `${fontSize - 2}px` }}
                    >
                      {segment.cn}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- BOTTOM CONTROLS --- */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out ${
          showControls
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }`}
      >
        <div className="bg-[#fcfbf9]/90 backdrop-blur-md border-t border-stone-200 px-6 py-6 pb-8">
          {/* Interactive Progress Slider */}
          <div className="flex items-center gap-4 text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-6">
            <span className="w-8 text-right font-variant-numeric tabular-nums">
              {currentDisplayIndex}
            </span>

            <div className="relative flex-1 h-6 flex items-center">
              {/* Custom Track Background */}
              <div className="absolute w-full h-0.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-stone-300"
                  style={{
                    width: `${
                      (activeSegmentIndex / (totalSegments - 1)) * 100
                    }%`,
                  }}
                />
              </div>

              {/* Native Range Input */}
              <input
                type="range"
                min="0"
                max={totalSegments - 1}
                step="1"
                value={activeSegmentIndex}
                onChange={handleSliderChange}
                onPointerDown={handleSliderPointerDown}
                onPointerUp={handleSliderPointerUp}
                onTouchStart={handleSliderPointerDown}
                onTouchEnd={handleSliderPointerUp}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
              />

              {/* Custom Thumb (Visual Only - follows calculated position) */}
              <div
                className="absolute w-3 h-3 bg-stone-900 rounded-full shadow-sm pointer-events-none transition-transform duration-75 ease-out"
                style={{
                  left: `calc(${
                    (activeSegmentIndex / (totalSegments - 1)) * 100
                  }% - 6px)`,
                }}
              />
            </div>

            <span className="w-8 font-variant-numeric tabular-nums">
              {totalSegments}
            </span>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center max-w-xl mx-auto">
            {/* Font Control */}
            <div className="flex items-center gap-2 border border-stone-200 rounded-full p-1 bg-white">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFontSize(Math.max(14, fontSize - 2));
                }}
                className="w-10 h-8 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
              >
                <span className="text-xs font-serif">A</span>
              </button>
              <div className="w-px h-4 bg-stone-200"></div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFontSize(Math.min(32, fontSize + 2));
                }}
                className="w-10 h-8 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
              >
                <span className="text-xl font-serif">A</span>
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex border border-stone-200 rounded-full p-1 bg-white">
              {[
                { id: DisplayMode.English, label: "EN" },
                { id: DisplayMode.Bilingual, label: "ALL" },
                { id: DisplayMode.Chinese, label: "CN" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDisplayMode(mode.id);
                  }}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    displayMode === mode.id
                      ? "bg-stone-900 text-white shadow-md"
                      : "text-stone-400 hover:text-stone-600"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reader;
