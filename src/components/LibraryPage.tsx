import React from 'react';
import { Home, Menu } from 'lucide-react';

interface LibraryPageProps {
  onGoHome: () => void;
  onToggleSidebar?: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  onGoHome,
  onToggleSidebar,
}) => {
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[#FAF7F2] select-none">
      {/* Top Bar */}
      <header className="w-full border-b border-stone-200/60 bg-[#FAF7F2] px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-4 min-h-[48px]">
        {/* Sidebar toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-stone-200/50 transition-colors cursor-pointer shrink-0"
            title="Toggle sidebar"
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Home button */}
        <button
          onClick={onGoHome}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-stone-200/60 border border-stone-200/80 bg-white shadow-2xs transition-all cursor-pointer shrink-0"
          title="Return to Chat"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-[#A36224]" />
          <span className="text-xs sm:text-sm font-medium">Home</span>
        </button>

        {/* Title — centred in the remaining space */}
        <h1 className="flex-1 text-center text-sm sm:text-lg font-serif tracking-wider font-semibold text-slate-800 truncate">
          Ebook Library
        </h1>

        {/* Right spacer to visually balance the left controls */}
        <div className="shrink-0 w-[60px] sm:w-[80px]" />
      </header>

      {/* Main Creamy Background Page Content Area */}
      <main className="flex-1 w-full bg-[#FAF7F2] flex items-center justify-center p-6">
        {/* Intentionally blank creamy canvas for future ebook collection */}
      </main>
    </div>
  );
};
