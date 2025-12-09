import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Check, CheckCircle, Circle, Type, X } from 'lucide-react';
import { BookData, DisplayMode } from '../types';
import { saveProgress, getProgress, toggleCompletion } from '../services/storage';

interface ReaderProps {
  book: BookData;
  onBack: () => void;
}

const Reader: React.FC<ReaderProps> = ({ book, onBack }) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>(DisplayMode.Bilingual);
  const [fontSize, setFontSize] = useState(18);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Initialize: Load progress
  useEffect(() => {
    const saved = getProgress(book.id);
    if (saved) {
      setIsCompleted(saved.isCompleted || false);
      if (saved.segmentIndex >= 0 && saved.segmentIndex < book.segments.length) {
        setActiveSegmentIndex(saved.segmentIndex);
        setTimeout(() => {
          segmentRefs.current[saved.segmentIndex]?.scrollIntoView({
            behavior: 'auto',
            block: 'center',
          });
        }, 100);
      }
    }
  }, [book.id, book.segments.length]);

  // Setup Intersection Observer
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const options = {
      root: containerRef.current,
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0,
    };

    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
          setActiveSegmentIndex(index);
          saveProgress(book.id, index);
        }
      });
    }, options);

    segmentRefs.current.forEach((el) => {
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [book.segments]);

  // Handle Scroll to toggle controls
  const lastScrollY = useRef(0);
  const handleScroll = () => {
    if (!containerRef.current) return;
    const currentScrollY = containerRef.current.scrollTop;
    if (Math.abs(currentScrollY - lastScrollY.current) > 50) {
      setShowControls(false);
      lastScrollY.current = currentScrollY;
    }
  };

  const handleContainerClick = () => {
    setShowControls(!showControls);
  };

  const toggleReadStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = !isCompleted;
    setIsCompleted(newState);
    toggleCompletion(book.id, newState);
  };

  const currentPercent = Math.round(((activeSegmentIndex + 1) / book.segments.length) * 100);

  return (
    <div className="relative h-screen w-full bg-[#fcfbf9] overflow-hidden flex flex-col font-sans">
      
      {/* --- TOP BAR --- */}
      <div 
        className={`absolute top-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out ${showControls ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}
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
                 ? 'bg-stone-900 text-white ring-1 ring-stone-900' 
                 : 'bg-transparent text-stone-500 ring-1 ring-stone-200 hover:text-stone-900 hover:ring-stone-400'
             }`}
          >
            {isCompleted ? <Check size={12} strokeWidth={3} /> : <Circle size={12} strokeWidth={3} />}
            <span>{isCompleted ? 'Done' : 'Mark Done'}</span>
          </button>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div 
        className="flex-1 relative w-full h-full"
        onClick={handleContainerClick}
      >
        {/* Gradient Fade Masks */}
        <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#fcfbf9] via-[#fcfbf9]/90 to-transparent z-20 pointer-events-none transition-opacity duration-700 ${showControls ? 'opacity-100' : 'opacity-40'}`} />
        <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#fcfbf9] via-[#fcfbf9]/90 to-transparent z-20 pointer-events-none transition-opacity duration-700 ${showControls ? 'opacity-100' : 'opacity-40'}`} />

        {/* Scroll Container */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto no-scrollbar scroll-smooth px-6 py-[50vh]"
        >
          <div className="max-w-xl mx-auto space-y-16">
            {book.segments.map((segment, index) => {
              const isActive = index === activeSegmentIndex;
              
              return (
                <div 
                  key={segment.id}
                  data-index={index}
                  ref={(el) => { segmentRefs.current[index] = el; }}
                  className={`transition-all duration-700 ease-out flex flex-col gap-4
                    ${isActive ? 'opacity-100 transform-none blur-0' : 'opacity-20 scale-95 blur-[1px] grayscale'}`}
                >
                  {(displayMode === DisplayMode.Bilingual || displayMode === DisplayMode.English) && (
                    <p 
                      className="font-serif text-stone-900 leading-relaxed transition-all"
                      style={{ fontSize: `${fontSize}px` }}
                    >
                      {segment.en}
                    </p>
                  )}
                  {(displayMode === DisplayMode.Bilingual || displayMode === DisplayMode.Chinese) && (
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
        className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-500 ease-in-out ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}
      >
        <div className="bg-[#fcfbf9]/90 backdrop-blur-md border-t border-stone-200 px-6 py-6 pb-8">
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-4 text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-6">
            <span className="w-8 text-right">{currentPercent}%</span>
            <div className="flex-1 h-0.5 bg-stone-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ease-out ${isCompleted ? 'bg-stone-900' : 'bg-stone-500'}`}
                style={{ width: `${currentPercent}%` }}
              />
            </div>
            <span className="w-8">END</span>
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center max-w-xl mx-auto">
            
            {/* Font Control */}
            <div className="flex items-center gap-2 border border-stone-200 rounded-full p-1 bg-white">
               <button 
                onClick={(e) => { e.stopPropagation(); setFontSize(Math.max(14, fontSize - 2)); }}
                className="w-10 h-8 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
              >
                <span className="text-xs font-serif">A</span>
              </button>
              <div className="w-px h-4 bg-stone-200"></div>
              <button 
                onClick={(e) => { e.stopPropagation(); setFontSize(Math.min(32, fontSize + 2)); }}
                className="w-10 h-8 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
              >
                <span className="text-xl font-serif">A</span>
              </button>
            </div>

            {/* Language Toggle */}
            <div className="flex border border-stone-200 rounded-full p-1 bg-white">
              {[
                { id: DisplayMode.English, label: 'EN' },
                { id: DisplayMode.Bilingual, label: 'ALL' },
                { id: DisplayMode.Chinese, label: 'CN' },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={(e) => { e.stopPropagation(); setDisplayMode(mode.id); }}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                    displayMode === mode.id 
                      ? 'bg-stone-900 text-white shadow-md' 
                      : 'text-stone-400 hover:text-stone-600'
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